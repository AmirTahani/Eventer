export type NavMatch = 'exact' | 'prefix';

export type DashboardNavItem = {
  href: string;
  label: string;
  match?: NavMatch;
};

export const primaryTabs: DashboardNavItem[] = [
  { href: '/dashboard', label: 'Home', match: 'exact' },
  { href: '/dashboard/events', label: 'Events' },
  { href: '/dashboard/tickets', label: 'Tickets' },
  { href: '/dashboard/invitations', label: 'Invites' },
];

export const moreNav: DashboardNavItem[] = [
  { href: '/dashboard/djs', label: 'DJs' },
  { href: '/dashboard/locations', label: 'Locations' },
  { href: '/dashboard/users', label: 'Users' },
  { href: '/dashboard/audit', label: 'Audit' },
];

export const allNav: DashboardNavItem[] = [...primaryTabs, ...moreNav];

export function isNavSelected(
  pathname: string,
  href: string,
  match: NavMatch = 'prefix',
) {
  if (match === 'exact') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const titles: Array<{ test: (path: string) => boolean; title: string }> = [
  { test: (p) => p === '/dashboard', title: 'Home' },
  { test: (p) => p.startsWith('/dashboard/events/new'), title: 'New event' },
  { test: (p) => p.startsWith('/dashboard/events'), title: 'Events' },
  { test: (p) => p.startsWith('/dashboard/tickets'), title: 'Tickets' },
  { test: (p) => p.startsWith('/dashboard/invitations'), title: 'Invites' },
  { test: (p) => p.startsWith('/dashboard/djs'), title: 'DJs' },
  { test: (p) => p.startsWith('/dashboard/locations'), title: 'Locations' },
  { test: (p) => p.startsWith('/dashboard/users'), title: 'Users' },
  { test: (p) => p.startsWith('/dashboard/audit'), title: 'Audit' },
];

export function screenTitle(pathname: string): string {
  return titles.find((t) => t.test(pathname))?.title ?? 'Eventer';
}

export function parentPath(pathname: string): string | null {
  if (pathname === '/dashboard/events/new') return '/dashboard/events';
  if (pathname.split('/').length > 3 && pathname.startsWith('/dashboard/')) {
    return pathname.split('/').slice(0, 3).join('/');
  }
  return null;
}
