import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthUser } from '../auth/policies';

/**
 * Unit-testable ownership guard: /users/me must only expose the JWT subject.
 */
@Injectable()
export class SelfOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      user?: AuthUser;
      params: { id?: string };
    }>();
    if (!req.user) throw new UnauthorizedException();
    if (req.params.id && req.params.id !== req.user.id) {
      throw new UnauthorizedException('IDOR: cannot access another user');
    }
    return true;
  }
}
