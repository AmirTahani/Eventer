import { describe, expect, it } from 'vitest';
import {
  allNav,
  isNavSelected,
  parentPath,
  primaryTabs,
  screenTitle,
} from './dashboard-nav';

describe('dashboard-nav', () => {
  it('keeps primary tabs distinct from more nav', () => {
    expect(primaryTabs.map((t) => t.href)).toEqual([
      '/dashboard',
      '/dashboard/events',
      '/dashboard/tickets',
      '/dashboard/invitations',
    ]);
    expect(allNav.length).toBeGreaterThan(primaryTabs.length);
  });

  it('matches exact vs prefix selection', () => {
    expect(isNavSelected('/dashboard', '/dashboard', 'exact')).toBe(true);
    expect(isNavSelected('/dashboard/events', '/dashboard', 'exact')).toBe(
      false,
    );
    expect(isNavSelected('/dashboard/events/new', '/dashboard/events')).toBe(
      true,
    );
  });

  it('resolves screen titles', () => {
    expect(screenTitle('/dashboard')).toBe('Home');
    expect(screenTitle('/dashboard/events/new')).toBe('New event');
    expect(screenTitle('/dashboard/invitations')).toBe('Invites');
    expect(screenTitle('/unknown')).toBe('Eventer');
  });

  it('resolves parent paths for nested screens', () => {
    expect(parentPath('/dashboard/events/new')).toBe('/dashboard/events');
    expect(parentPath('/dashboard/events/abc')).toBe('/dashboard/events');
    expect(parentPath('/dashboard')).toBeNull();
  });
});
