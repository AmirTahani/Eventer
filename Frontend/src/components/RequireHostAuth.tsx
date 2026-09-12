'use client';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';

export type HostRole = 'ADMIN' | 'ORGANIZER' | 'VOUCHER';

export const ORGANIZER_CONSOLE_ROLES = ['ADMIN', 'ORGANIZER'] as const satisfies readonly HostRole[];
export const ADMIN_CONSOLE_ROLES = ['ADMIN'] as const satisfies readonly HostRole[];

export function RequireHostAuth({
  children,
  roles,
  loginHref,
  label = 'console',
}: {
  children: ReactNode;
  roles: readonly HostRole[];
  loginHref: string;
  label?: string;
}) {
  const { ready, accessToken, user, hasRole, clearSession } = useAuth();
  const router = useRouter();
  const roleKey = roles.join('|');
  const allowed = Boolean(accessToken && user && hasRole(...roles));

  useEffect(() => {
    if (!ready) return;
    if (!accessToken || !user) {
      router.replace(loginHref);
      return;
    }
    if (!hasRole(...roles)) {
      clearSession();
      router.replace(
        `${loginHref}${loginHref.includes('?') ? '&' : '?'}denied=1`,
      );
    }
  }, [ready, accessToken, user, hasRole, roleKey, loginHref, clearSession, router, roles]);

  if (!ready || !allowed) {
    return (
      <Box
        sx={{
          minHeight: '60vh',
          display: 'grid',
          placeItems: 'center',
          gap: 2,
          px: 2,
        }}
      >
        <CircularProgress size={28} />
        <Typography color="text.secondary" variant="body2">
          Checking {label} access…
        </Typography>
      </Box>
    );
  }

  return children;
}
