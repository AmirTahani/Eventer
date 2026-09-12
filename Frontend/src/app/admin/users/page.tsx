'use client';

import { useMemo, useState } from 'react';
import {
  AdminDataPage,
  AdminFilterBar,
  AdminLoadingState,
  AdminTable,
  useAdminResource,
} from '@/components/admin-ui';
import { fetchAdminUsers } from '@/lib/api';

export default function AdminUsersPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [nonce, setNonce] = useState(0);
  const query = useMemo(() => ({ q, status }), [q, status]);
  const { data, error, loading } = useAdminResource(
    (token) => fetchAdminUsers(token, query),
    [query.q, query.status, nonce],
  );

  const rows = (data?.items ?? []).map((item) => {
    const roles = item.roles as Array<{ role: string }> | undefined;
    const counts = item.counts as
      | {
          eventsOrganized?: number;
          registrations?: number;
          invitationsSent?: number;
        }
      | undefined;
    const roleLabels = roles?.map((r) => r.role).join(', ') || 'GUEST';
    return {
      key: String(item.id),
      href: `/admin/users/${item.id}`,
      cells: [
        `${item.firstName}${item.lastName ? ` ${item.lastName}` : ''}`,
        item.telegramUsername ? `@${item.telegramUsername}` : String(item.telegramUserId),
        String(item.status),
        roleLabels,
        String(counts?.eventsOrganized ?? 0),
        String(counts?.registrations ?? 0),
        String(counts?.invitationsSent ?? 0),
        new Date(String(item.createdAt)).toLocaleDateString(),
      ],
    };
  });

  return (
    <AdminDataPage
      title="All users"
      subtitle="Organizers, admins, and guests (Telegram accounts). Guests typically have no console roles."
    >
      <AdminFilterBar
        q={q}
        onQ={setQ}
        status={status}
        onStatus={setStatus}
        statusOptions={['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].map(
          (value) => ({ value, label: value }),
        )}
        onRefresh={() => setNonce((n) => n + 1)}
      />
      <AdminLoadingState
        loading={loading}
        error={error}
        empty={!loading && rows.length === 0}
      >
        <AdminTable
          headers={[
            'Name',
            'Telegram',
            'Status',
            'Roles',
            'Events',
            'Regs',
            'Invites',
            'Joined',
          ]}
          rows={rows}
        />
      </AdminLoadingState>
    </AdminDataPage>
  );
}
