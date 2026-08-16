'use client';

import { createTheme } from '@mui/material/styles';

/** Luxury navy palette — full RTL/locale wiring lands in M13 (see 07-design-system.md). */
export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#070B14',
      paper: '#0F1626',
    },
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
    text: {
      primary: '#EDEFF4',
      secondary: '#9AA3B5',
    },
    divider: 'rgba(92,130,201,0.16)',
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: { fontFamily: '"Playfair Display", Georgia, serif' },
    h2: { fontFamily: '"Playfair Display", Georgia, serif' },
    h3: { fontFamily: '"Playfair Display", Georgia, serif' },
  },
  shape: { borderRadius: 8 },
});
