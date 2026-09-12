'use client';

import { RequireHostAuth, ORGANIZER_CONSOLE_ROLES } from '@/components/RequireHostAuth';
import { DashboardShell } from '@/components/DashboardShell';
import type { ReactNode } from 'react';

export default function DashboardLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RequireHostAuth
      roles={ORGANIZER_CONSOLE_ROLES}
      loginHref="/login"
      label="organizer"
    >
      <DashboardShell>{children}</DashboardShell>
    </RequireHostAuth>
  );
}
