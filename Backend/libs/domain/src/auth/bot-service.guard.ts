import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@eventer/common';

/**
 * Authenticates the Telegram bot process via BOT_SERVICE_TOKEN bearer.
 */
@Injectable()
export class BotServiceGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Env, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
    }>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bot service token');
    }
    const token = header.slice('Bearer '.length).trim();
    const expected = this.config.get('BOT_SERVICE_TOKEN', { infer: true });
    if (!token || token !== expected) {
      throw new UnauthorizedException('Invalid bot service token');
    }
    return true;
  }
}
