'use client';

import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import { AuthProvider } from '@/lib/auth';
import { ColorModeProvider, useColorMode } from '@/theme/color-mode';
import { getTheme } from '@/theme/theme';

type Props = {
  children: ReactNode;
  locale?: 'en' | 'fa';
};

function ThemedApp({
  children,
  locale,
}: {
  children: ReactNode;
  locale: 'en' | 'fa';
}) {
  const direction = locale === 'fa' ? 'rtl' : 'ltr';
  const { mode } = useColorMode();
  const theme = useMemo(
    () => getTheme(direction, locale, mode),
    [direction, locale, mode],
  );
  const cache = useMemo(
    () =>
      createCache({
        key: direction === 'rtl' ? 'muirtl' : 'mui',
        stylisPlugins: direction === 'rtl' ? [prefixer, rtlPlugin] : [prefixer],
      }),
    [direction],
  );

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}

export function AppProviders({ children, locale = 'en' }: Props) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ColorModeProvider>
        <ThemedApp locale={locale}>{children}</ThemedApp>
      </ColorModeProvider>
    </QueryClientProvider>
  );
}
