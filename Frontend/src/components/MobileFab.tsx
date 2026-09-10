'use client';

import Fab from '@mui/material/Fab';
import Link from 'next/link';
import type { ReactNode } from 'react';

type Props = {
  onClick?: () => void;
  href?: string;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
};

export function MobileFab({ onClick, href, label, icon, disabled }: Props) {
  const sharedSx = {
    display: { xs: 'inline-flex', md: 'none' },
    position: 'fixed' as const,
    right: 16,
    bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
    zIndex: (t: { zIndex: { appBar: number } }) => t.zIndex.appBar - 1,
    px: 2.25,
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.18)',
  };

  if (href) {
    return (
      <Fab
        color="primary"
        variant="extended"
        component={Link}
        href={href}
        disabled={disabled}
        aria-label={label}
        sx={sharedSx}
      >
        {icon}
        {label}
      </Fab>
    );
  }

  return (
    <Fab
      color="primary"
      variant="extended"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      sx={sharedSx}
    >
      {icon}
      {label}
    </Fab>
  );
}

