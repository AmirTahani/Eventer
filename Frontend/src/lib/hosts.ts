export function isAdminHost(hostname?: string): boolean {
  const host =
    hostname ??
    (typeof window !== 'undefined' ? window.location.hostname : '');
  return host === 'admin.eventer.world' || host === 'admin.localhost';
}

export function isOrganizerHost(hostname?: string): boolean {
  const host =
    hostname ??
    (typeof window !== 'undefined' ? window.location.hostname : '');
  return (
    host === 'app.eventer.world' ||
    host === 'app.localhost' ||
    host === 'localhost' ||
    host === '127.0.0.1'
  );
}

export function canAccessOrganizerConsole(roles: string[] | undefined | null) {
  return Boolean(
    roles?.some((role) => role === 'ADMIN' || role === 'ORGANIZER'),
  );
}

export function canAccessAdminConsole(roles: string[] | undefined | null) {
  return Boolean(roles?.includes('ADMIN'));
}
