import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser } from '../auth/policies';
import { InMemoryRateLimiter } from './rate-limiter';

export const RATE_LIMIT_KEY = 'rate_limit';

export type RateLimitOptions = {
  /** Logical bucket name (e.g. checkin-scan, invitation-create) */
  name: string;
  limit: number;
  windowMs: number;
};

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

const limiters = new Map<string, InMemoryRateLimiter>();

function getLimiter(options: RateLimitOptions): InMemoryRateLimiter {
  const key = `${options.name}:${options.limit}:${options.windowMs}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new InMemoryRateLimiter(options.limit, options.windowMs);
    limiters.set(key, limiter);
  }
  return limiter;
}

/** Test helper — clears all in-memory limiters. */
export function resetRateLimiters(): void {
  limiters.clear();
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions | undefined>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!options) return true;

    const req = context.switchToHttp().getRequest<{
      user?: AuthUser;
      ip?: string;
      body?: { eventId?: string };
    }>();
    const userId = req.user?.id ?? 'anon';
    const eventPart = req.body?.eventId ? `:${req.body.eventId}` : '';
    const key = `${options.name}:${userId}${eventPart}:${req.ip ?? ''}`;

    if (!getLimiter(options).allow(key)) {
      throw new HttpException(
        'Too many requests — slow down',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
