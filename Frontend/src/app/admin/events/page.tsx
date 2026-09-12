'use client';

import { useMemo, useState } from 'react';
import {
  AdminDataPage,
  AdminFilterBar,
  AdminLoadingState,
  AdminTable,
  useAdminResource,
} from '@/components/admin-ui';
import { fetchAdminEvents } from '@/lib/api';

export default function AdminEventsPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [nonce, setNonce] = useState(0);
  const query = useMemo(() => ({ q, status }), [q, status]);
  const { data, error, loading } = useAdminResource(
    (token) => fetchAdminEvents(token, query),
    [query.q, query.status, nonce],
  );

  const rows = (data?.items ?? []).map((item) => {
    const organizer = item.organizer as
      | { firstName?: string; telegramUsername?: string | null }
      | undefined;
    const counts = item.counts as
      | { registrations?: number; waitlistEntries?: number; checkIns?: number }
      | undefined;
    return {
      key: String(item.id),
      href: `/admin/events/${item.id}`,
      cells: [
        String(item.name),
        String(item.status),
        organizer?.telegramUsername
          ? `@${organizer.telegramUsername}`
          : organizer?.firstName ?? '—',
        new Date(String(item.startAt)).toLocaleString(),
        `${item.price} ${item.currency}`,
        String(item.capacity),
        String(counts?.registrations ?? 0),
        String(counts?.waitlistEntries ?? 0),
        String(counts?.checkIns ?? 0),
      ],
    };
  });

  return (
    <AdminDataPage
      title="All events"
      subtitle="Every event on the platform, including drafts and cancelled nights."
    >
      <AdminFilterBar
        q={q}
        onQ={setQ}
        status={status}
        onStatus={setStatus}
        statusOptions={[
          'DRAFT',
          'OPEN',
          'FULL',
          'CLOSED',
          'CANCELLED',
          'COMPLETED',
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
            'Name',
            'Status',
            'Organizer',
            'Starts',
            'Price',
            'Capacity',
            'Regs',
            'Waitlist',
            'Check-ins',
          ]}
          rows={rows}
        />
      </AdminLoadingState>
    </AdminDataPage>
  );
}
