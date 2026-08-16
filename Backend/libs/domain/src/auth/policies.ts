export type AuthUser = {
  id: string;
  telegramUserId: string;
  firstName: string;
  lastName: string | null;
  telegramUsername: string | null;
  locale: 'en' | 'fa';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  roles: Array<'ADMIN' | 'ORGANIZER' | 'VOUCHER'>;
};

export function isAdmin(user: AuthUser): boolean {
  return user.roles.includes('ADMIN');
}

export function hasRole(
  user: AuthUser,
  role: 'ADMIN' | 'ORGANIZER' | 'VOUCHER',
): boolean {
  if (role === 'VOUCHER' && isAdmin(user)) return true;
  return user.roles.includes(role);
}

export function canManageEvent(
  user: AuthUser,
  organizerId: string,
): boolean {
  return isAdmin(user) || (hasRole(user, 'ORGANIZER') && user.id === organizerId);
}
