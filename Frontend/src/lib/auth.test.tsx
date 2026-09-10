import { describe, expect, it, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth, type AuthUser } from './auth';

const user: AuthUser = {
  id: 'u1',
  telegramUserId: '42',
  firstName: 'Amir',
  status: 'APPROVED',
  roles: ['ADMIN', 'VOUCHER'],
};

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts empty then becomes ready', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.accessToken).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('hydrates session from localStorage', async () => {
    window.localStorage.setItem('eventer.accessToken', 'jwt');
    window.localStorage.setItem('eventer.user', JSON.stringify(user));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.accessToken).toBe('jwt');
    expect(result.current.user?.firstName).toBe('Amir');
    expect(result.current.hasRole('ADMIN')).toBe(true);
    expect(result.current.hasRole('ORGANIZER')).toBe(false);
  });

  it('setSession persists token and user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));

    act(() => {
      result.current.setSession('new-jwt', user);
    });

    expect(result.current.accessToken).toBe('new-jwt');
    expect(window.localStorage.getItem('eventer.accessToken')).toBe('new-jwt');
    expect(JSON.parse(window.localStorage.getItem('eventer.user')!)).toEqual(
      user,
    );
  });

  it('clearSession wipes storage', async () => {
    window.localStorage.setItem('eventer.accessToken', 'jwt');
    window.localStorage.setItem('eventer.user', JSON.stringify(user));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));

    act(() => {
      result.current.clearSession();
    });

    expect(result.current.accessToken).toBeNull();
    expect(result.current.user).toBeNull();
    expect(window.localStorage.getItem('eventer.accessToken')).toBeNull();
  });

  it('throws outside provider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      /must be used within AuthProvider/,
    );
  });
});
