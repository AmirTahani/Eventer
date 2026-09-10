import { PoliciesService } from './policies.service';
import { AuthUser } from './policies';

describe('PoliciesService', () => {
  const service = new PoliciesService();
  const user: AuthUser = {
    id: 'u1',
    telegramUserId: '1',
    firstName: 'A',
    lastName: null,
    telegramUsername: null,
    locale: 'en',
    status: 'APPROVED',
    roles: ['ORGANIZER'],
  };

  it('canInvite for vouchers and admins only', () => {
    expect(service.canInvite(user)).toBe(false);
    expect(service.canInvite({ ...user, roles: ['VOUCHER'] })).toBe(true);
    expect(service.canInvite({ ...user, roles: ['ADMIN'] })).toBe(true);
  });

  it('delegates canManageEvent', () => {
    expect(service.canManageEvent(user, 'u1')).toBe(true);
    expect(service.canManageEvent(user, 'other')).toBe(false);
  });
});
