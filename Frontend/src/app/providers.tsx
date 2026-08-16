'use client';

import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import { getTheme } from '@/theme/theme';

type Props = {
  children: ReactNode;
  locale?: 'en' | 'fa';
};

export function AppProviders({ children, locale = 'en' }: Props) {
  const direction = locale === 'fa' ? 'rtl' : 'ltr';
  const theme = useMemo(() => getTheme(direction, locale), [direction, locale]);
  const cache = useMemo(
    () =>
      createCache({
        key: direction === 'rtl' ? 'muirtl' : 'mui',
        stylisPlugins: direction === 'rtl' ? [prefixer, rtlPlugin] : [prefixer],
      }),
    [direction],
  );
  const [queryClient] = useState(() => new QueryClient());

  return (
    <CacheProvider value={cache}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </CacheProvider>
  );
}
