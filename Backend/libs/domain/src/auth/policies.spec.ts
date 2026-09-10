import { AuthUser, canManageEvent, hasRole, isAdmin } from './policies';

const base: AuthUser = {
  id: 'user-1',
  telegramUserId: '1',
  firstName: 'A',
  lastName: null,
  telegramUsername: null,
  locale: 'en',
  status: 'APPROVED',
  roles: [],
};

describe('auth policies', () => {
  it('detects admin role', () => {
    expect(isAdmin({ ...base, roles: ['ADMIN'] })).toBe(true);
    expect(isAdmin(base)).toBe(false);
  });

  it('treats admin as implicit voucher', () => {
    expect(hasRole({ ...base, roles: ['ADMIN'] }, 'VOUCHER')).toBe(true);
    expect(hasRole({ ...base, roles: ['VOUCHER'] }, 'VOUCHER')).toBe(true);
    expect(hasRole(base, 'VOUCHER')).toBe(false);
  });

  it('scopes organizer event management to own events', () => {
    const organizer: AuthUser = { ...base, roles: ['ORGANIZER'] };
    expect(canManageEvent(organizer, 'user-1')).toBe(true);
    expect(canManageEvent(organizer, 'other')).toBe(false);
    expect(canManageEvent({ ...base, roles: ['ADMIN'] }, 'other')).toBe(true);
  });
});
