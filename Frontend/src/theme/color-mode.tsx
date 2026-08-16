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
import type { AppColorMode } from '@/theme/theme';

const STORAGE_KEY = 'eventer.colorMode';

type ColorModeContextValue = {
  mode: AppColorMode;
  ready: boolean;
  setMode: (mode: AppColorMode) => void;
  toggleMode: () => void;
};

const ColorModeContext = createContext<ColorModeContextValue | null>(null);

function readStoredMode(): AppColorMode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* ignore */
  }
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppColorMode>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setModeState(readStoredMode());
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  const setMode = useCallback((next: AppColorMode) => {
    setModeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next: AppColorMode = prev === 'light' ? 'dark' : 'light';
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ mode, ready, setMode, toggleMode }),
    [mode, ready, setMode, toggleMode],
  );

  return (
    <ColorModeContext.Provider value={value}>
      {children}
    </ColorModeContext.Provider>
  );
}

export function useColorMode() {
  const ctx = useContext(ColorModeContext);
  if (!ctx) {
    throw new Error('useColorMode must be used within ColorModeProvider');
  }
  return ctx;
}
