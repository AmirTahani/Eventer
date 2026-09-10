import { describe, expect, it, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ColorModeProvider, useColorMode } from './color-mode';

function wrapper({ children }: { children: ReactNode }) {
  return <ColorModeProvider>{children}</ColorModeProvider>;
}

describe('ColorModeProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }),
    });
  });

  it('defaults to light and becomes ready', async () => {
    const { result } = renderHook(() => useColorMode(), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.mode).toBe('light');
  });

  it('toggles and persists dark mode', async () => {
    const { result } = renderHook(() => useColorMode(), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));

    act(() => {
      result.current.toggleMode();
    });

    expect(result.current.mode).toBe('dark');
    expect(window.localStorage.getItem('eventer.colorMode')).toBe('dark');
  });

  it('throws outside provider', () => {
    expect(() => renderHook(() => useColorMode())).toThrow(
      /must be used within ColorModeProvider/,
    );
  });
});
