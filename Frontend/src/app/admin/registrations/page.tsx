'use client';

import { useMemo, useState } from 'react';
import {
  AdminDataPage,
  AdminFilterBar,
  AdminLoadingState,
  AdminTable,
  useAdminResource,
} from '@/components/admin-ui';
import { fetchAdminRegistrations } from '@/lib/api';

export default function AdminRegistrationsPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [nonce, setNonce] = useState(0);
  const query = useMemo(() => ({ status }), [status]);
  const { data, error, loading } = useAdminResource(
    (token) => fetchAdminRegistrations(token, query),
    [query.status, nonce],
  );

  const rows = (data?.items ?? [])
    .filter((item) => {
      if (!q.trim()) return true;
      return JSON.stringify(item).toLowerCase().includes(q.trim().toLowerCase());
    })
    .map((item) => {
      const event = item.event as { id?: string; name?: string };
      const user = item.primaryUser as { id?: string; firstName?: string };
      const payments = item.payments as Array<{ status?: string }>;
      return {
        key: String(item.id),
        href: event.id ? `/admin/events/${event.id}` : undefined,
        cells: [
          event.name ?? '—',
          user.firstName ?? '—',
          String(item.status),
          String(item.peopleCount),
          `${item.priceSnapshot} ${item.currency}`,
          String(item.guestCount ?? 0),
          payments.map((p) => p.status).join(', ') || '—',
          new Date(String(item.createdAt)).toLocaleString(),
        ],
      };
    });

  return (
    <AdminDataPage
      title="All registrations"
      subtitle="Guest registrations across every event, with payment and ticket summaries."
    >
      <AdminFilterBar
        q={q}
        onQ={setQ}
        status={status}
        onStatus={setStatus}
        statusOptions={[
          'PENDING_APPROVAL',
          'REJECTED',
          'APPROVED',
          'PENDING_PAYMENT',
          'CONFIRMED',
          'WAITLISTED',
          'CANCELLED',
          'EXPIRED',
        ].map((value) => ({ value, label: value }))}
        onRefresh={() => setNonce((n) => n + 1)}
      />
      <AdminLoadingState
        loading={loading}
        error={error}
        empty={!loading && rows.length === 0}
      >
        <AdminTable
          headers={[
            'Event',
            'Guest',
            'Status',
            'People',
            'Price',
            'Extra guests',
            'Payments',
            'Created',
          ]}
          rows={rows}
        />
      </AdminLoadingState>
    </AdminDataPage>
  );
}
