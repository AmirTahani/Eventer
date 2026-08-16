'use client';

import { createTheme, type Theme } from '@mui/material/styles';

export function getTheme(
  direction: 'ltr' | 'rtl',
  locale: 'en' | 'fa',
): Theme {
  const fa = locale === 'fa';
  return createTheme({
    direction,
    palette: {
      mode: 'dark',
      background: { default: '#070B14', paper: '#0F1626' },
      primary: {
        main: '#2E5AAC',
        light: '#5C82C9',
        dark: '#173868',
        contrastText: '#F3F4F7',
      },
      secondary: { main: '#7C8CA6' },
      success: { main: '#3F9C74' },
      warning: { main: '#C99A3E' },
      error: { main: '#B0453F' },
      info: { main: '#4E7FB0' },
      text: { primary: '#EDEFF4', secondary: '#9AA3B5' },
      divider: 'rgba(92,130,201,0.16)',
    },
    typography: {
      fontFamily: fa ? '"Vazirmatn", sans-serif' : '"Inter", sans-serif',
      h1: {
        fontFamily: fa ? '"Vazirmatn", serif' : '"Playfair Display", serif',
        fontWeight: 600,
      },
      h2: {
        fontFamily: fa ? '"Vazirmatn", serif' : '"Playfair Display", serif',
        fontWeight: 600,
      },
      h3: {
        fontFamily: fa ? '"Vazirmatn", serif' : '"Playfair Display", serif',
        fontWeight: 500,
      },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 10 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { padding: '10px 20px' },
          containedPrimary: {
            boxShadow: 'none',
            '&:hover': { boxShadow: '0 4px 14px rgba(46,90,172,0.35)' },
          },
        },
      },
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiAppBar: {
        styleOverrides: {
          root: { backgroundColor: '#173868', backgroundImage: 'none' },
        },
      },
    },
  });
}
