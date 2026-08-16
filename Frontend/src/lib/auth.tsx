'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const TOKEN_KEY = 'eventer.accessToken';
const USER_KEY = 'eventer.user';

export type AuthUser = {
  id: string;
  telegramUserId: string;
  firstName: string;
  status: string;
  roles: string[];
};

type AuthContextValue = {
  accessToken: string | null;
  user: AuthUser | null;
  ready: boolean;
  setSession: (accessToken: string, user: AuthUser) => void;
  setAccessTokenOnly: (accessToken: string) => void;
  clearSession: () => void;
  hasRole: (...roles: string[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const token = window.localStorage.getItem(TOKEN_KEY);
      const rawUser = window.localStorage.getItem(USER_KEY);
      if (token) setAccessToken(token);
      if (rawUser) setUser(JSON.parse(rawUser) as AuthUser);
    } catch {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    } finally {
      setReady(true);
    }
  }, []);

  const setSession = useCallback((token: string, nextUser: AuthUser) => {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setAccessToken(token);
    setUser(nextUser);
  }, []);

  const setAccessTokenOnly = useCallback((token: string) => {
    window.localStorage.setItem(TOKEN_KEY, token);
    setAccessToken(token);
  }, []);

  const clearSession = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setAccessToken(null);
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (...roles: string[]) =>
      !!user?.roles.some((role) => roles.includes(role)),
    [user],
  );

  const value = useMemo(
    () => ({
      accessToken,
      user,
      ready,
      setSession,
      setAccessTokenOnly,
      clearSession,
      hasRole,
    }),
    [
      accessToken,
      user,
      ready,
      setSession,
      setAccessTokenOnly,
      clearSession,
      hasRole,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
