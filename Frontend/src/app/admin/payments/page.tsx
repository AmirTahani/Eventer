'use client';

import { useMemo, useState } from 'react';
import {
  AdminDataPage,
  AdminFilterBar,
  AdminLoadingState,
  AdminTable,
  useAdminResource,
} from '@/components/admin-ui';
import { fetchAdminPayments } from '@/lib/api';

export default function AdminPaymentsPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [nonce, setNonce] = useState(0);
  const query = useMemo(() => ({ status }), [status]);
  const { data, error, loading } = useAdminResource(
    (token) => fetchAdminPayments(token, query),
    [query.status, nonce],
  );

  const rows = (data?.items ?? [])
    .filter((item) => {
      if (!q.trim()) return true;
      const blob = JSON.stringify(item).toLowerCase();
      return blob.includes(q.trim().toLowerCase());
    })
    .map((item) => {
      const reg = item.registration as {
        event?: { id?: string; name?: string };
        primaryUser?: { firstName?: string; id?: string };
      };
      return {
        key: String(item.id),
        href: reg.event?.id ? `/admin/events/${reg.event.id}` : undefined,
        cells: [
          String(item.status),
          `${item.amount} ${item.currency}`,
          String(item.provider),
          String(item.providerTransactionId ?? '—'),
          reg.event?.name ?? '—',
          reg.primaryUser?.firstName ?? '—',
          String(item.attemptNumber),
          String(item.refundStatus),
          new Date(String(item.createdAt)).toLocaleString(),
        ],
      };
    });

  return (
    <AdminDataPage
      title="All payments"
      subtitle="Every payment attempt, including failed and cancelled checkouts."
    >
      <AdminFilterBar
        q={q}
        onQ={setQ}
        status={status}
        onStatus={setStatus}
        statusOptions={[
          'CREATED',
          'PROCESSING',
          'SUCCEEDED',
          'FAILED',
          'CANCELLED',
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
            'Status',
            'Amount',
            'Provider',
            'Provider TX',
            'Event',
            'User',
            'Attempt',
            'Refund',
            'Created',
          ]}
          rows={rows}
        />
      </AdminLoadingState>
    </AdminDataPage>
  );
}
