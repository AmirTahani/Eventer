'use client';

import { useMemo, useState } from 'react';
import {
  AdminDataPage,
  AdminFilterBar,
  AdminLoadingState,
  AdminTable,
  useAdminResource,
} from '@/components/admin-ui';
import { fetchAdminTickets } from '@/lib/api';

export default function AdminTicketsPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [nonce, setNonce] = useState(0);
  const query = useMemo(() => ({ status }), [status]);
  const { data, error, loading } = useAdminResource(
    (token) => fetchAdminTickets(token, query),
    [query.status, nonce],
  );

  const rows = (data?.items ?? [])
    .filter((item) => {
      if (!q.trim()) return true;
      return JSON.stringify(item).toLowerCase().includes(q.trim().toLowerCase());
    })
    .map((item) => {
      const reg = item.registration as {
        event?: { id?: string; name?: string };
        primaryUser?: { firstName?: string };
      };
      const checkIns = item.checkIns as Array<{ method?: string }> | undefined;
      return {
        key: String(item.id),
        href: reg.event?.id ? `/admin/events/${reg.event.id}` : undefined,
        cells: [
          String(item.status),
          String(item.holderType),
          reg.event?.name ?? '—',
          reg.primaryUser?.firstName ?? '—',
          String(item.qrToken).slice(0, 12) + '…',
          checkIns?.length ? checkIns.map((c) => c.method).join(', ') : '—',
          new Date(String(item.createdAt)).toLocaleString(),
        ],
      };
    });

  return (
    <AdminDataPage
      title="All tickets"
      subtitle="Issued, checked-in, and void tickets with QR tokens."
    >
      <AdminFilterBar
        q={q}
        onQ={setQ}
        status={status}
        onStatus={setStatus}
        statusOptions={['ISSUED', 'CHECKED_IN', 'VOID'].map((value) => ({
          value,
          label: value,
        }))}
        onRefresh={() => setNonce((n) => n + 1)}
      />
      <AdminLoadingState
        loading={loading}
        error={error}
        empty={!loading && rows.length === 0}
      >
        <AdminTable
          headers={[
            'Status',
            'Holder',
            'Event',
            'User',
            'QR',
            'Check-ins',
            'Created',
          ]}
          rows={rows}
        />
      </AdminLoadingState>
    </AdminDataPage>
  );
}
