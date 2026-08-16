import { Injectable } from '@nestjs/common';
import { AuthUser, canManageEvent, hasRole, isAdmin } from './policies';

@Injectable()
export class PoliciesService {
  isAdmin(user: AuthUser): boolean {
    return isAdmin(user);
  }

  hasRole(user: AuthUser, role: 'ADMIN' | 'ORGANIZER' | 'VOUCHER'): boolean {
    return hasRole(user, role);
  }

  canManageEvent(user: AuthUser, organizerId: string): boolean {
    return canManageEvent(user, organizerId);
  }

  canInvite(user: AuthUser): boolean {
    return this.hasRole(user, 'VOUCHER') || this.isAdmin(user);
  }
}
