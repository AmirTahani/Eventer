import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser, hasRole } from './policies';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Array<'ADMIN' | 'ORGANIZER' | 'VOUCHER'>) =>
  SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<
      Array<'ADMIN' | 'ORGANIZER' | 'VOUCHER'>
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!required?.length) return true;

    const req = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = req.user;
    if (!user) throw new ForbiddenException('Not authenticated');

    const ok = required.some((role) => hasRole(user, role));
    if (!ok) throw new ForbiddenException('Insufficient role');
    return true;
  }
}
