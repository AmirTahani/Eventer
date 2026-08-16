'use client';

import { createTheme, type Theme, type PaletteMode } from '@mui/material/styles';

export type AppColorMode = PaletteMode;

/**
 * Professional console themes — cool stone + teal (light) and charcoal + teal (dark).
 */
export function getTheme(
  direction: 'ltr' | 'rtl',
  locale: 'en' | 'fa',
  mode: AppColorMode = 'light',
): Theme {
  const fa = locale === 'fa';
  const display = fa
    ? '"Vazirmatn", sans-serif'
    : '"Source Serif 4", Georgia, serif';
  const body = fa
    ? '"Vazirmatn", sans-serif'
    : '"Source Sans 3", system-ui, sans-serif';
  const dark = mode === 'dark';

  return createTheme({
    direction,
    palette: {
      mode,
      ...(dark
        ? {
            background: {
              default: '#0E1116',
              paper: '#161B22',
            },
            primary: {
              main: '#2DD4BF',
              light: '#5EEAD4',
              dark: '#0F766E',
              contrastText: '#042F2E',
            },
            secondary: {
              main: '#94A3B8',
              contrastText: '#0F172A',
            },
            success: { main: '#4ADE80' },
            warning: { main: '#FBBF24' },
            error: { main: '#F87171' },
            info: { main: '#38BDF8' },
            text: {
              primary: '#E8EDF4',
              secondary: '#9AA6B8',
            },
            divider: 'rgba(148, 163, 184, 0.16)',
          }
        : {
            background: {
              default: '#F3F5F7',
              paper: '#FFFFFF',
            },
            primary: {
              main: '#0F766E',
              light: '#14B8A6',
              dark: '#115E59',
              contrastText: '#F8FAFA',
            },
            secondary: {
              main: '#334155',
              contrastText: '#F8FAFC',
            },
            success: { main: '#15803D' },
            warning: { main: '#B45309' },
            error: { main: '#B91C1C' },
            info: { main: '#0369A1' },
            text: {
              primary: '#0F172A',
              secondary: '#475569',
            },
            divider: 'rgba(15, 23, 42, 0.1)',
          }),
    },
    typography: {
      fontFamily: body,
      h1: { fontFamily: display, fontWeight: 600, letterSpacing: '-0.02em' },
      h2: { fontFamily: display, fontWeight: 600, letterSpacing: '-0.02em' },
      h3: { fontFamily: display, fontWeight: 600, letterSpacing: '-0.015em' },
      h4: { fontFamily: display, fontWeight: 600 },
      h5: { fontFamily: display, fontWeight: 600 },
      h6: { fontFamily: display, fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
      subtitle1: { fontWeight: 600 },
      body1: { lineHeight: 1.6 },
      body2: { lineHeight: 1.55 },
    },
    shape: { borderRadius: 8 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage: dark
              ? 'radial-gradient(ellipse 100% 70% at 0% -10%, rgba(45, 212, 191, 0.08), transparent 45%), radial-gradient(ellipse 70% 50% at 100% 0%, rgba(148, 163, 184, 0.06), transparent 40%)'
              : 'radial-gradient(ellipse 120% 80% at 0% -20%, rgba(15, 118, 110, 0.07), transparent 50%), radial-gradient(ellipse 80% 60% at 100% 0%, rgba(15, 23, 42, 0.04), transparent 45%)',
            backgroundAttachment: 'fixed',
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            paddingInline: 18,
            paddingBlock: 9,
            borderRadius: 8,
          },
          containedPrimary: {
            '&:hover': {
              backgroundColor: dark ? '#5EEAD4' : '#115E59',
            },
          },
          outlined: {
            borderColor: dark
              ? 'rgba(148, 163, 184, 0.28)'
              : 'rgba(15, 23, 42, 0.18)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: dark
              ? '1px solid rgba(148, 163, 184, 0.12)'
              : '1px solid rgba(15, 23, 42, 0.08)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: dark
              ? 'rgba(14, 17, 22, 0.9)'
              : 'rgba(255,255,255,0.92)',
            color: dark ? '#E8EDF4' : '#0F172A',
            backgroundImage: 'none',
            borderBottom: dark
              ? '1px solid rgba(148, 163, 184, 0.12)'
              : '1px solid rgba(15, 23, 42, 0.08)',
            backdropFilter: 'blur(10px)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: dark ? '#12161C' : '#FAFBFC',
            borderRight: dark
              ? '1px solid rgba(148, 163, 184, 0.12)'
              : '1px solid rgba(15, 23, 42, 0.08)',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            marginInline: 8,
            '&.Mui-selected': {
              backgroundColor: dark
                ? 'rgba(45, 212, 191, 0.12)'
                : 'rgba(15, 118, 110, 0.1)',
              color: dark ? '#5EEAD4' : '#115E59',
              '&:hover': {
                backgroundColor: dark
                  ? 'rgba(45, 212, 191, 0.18)'
                  : 'rgba(15, 118, 110, 0.14)',
              },
            },
          },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'small', fullWidth: true },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 8 },
        },
      },
    },
  });
}
