'use client';

import { useMemo, useState } from 'react';
import {
  AdminDataPage,
  AdminFilterBar,
  AdminLoadingState,
  AdminTable,
  useAdminResource,
} from '@/components/admin-ui';
import { fetchAdminAuditLogs } from '@/lib/api';

export default function AdminAuditPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [nonce, setNonce] = useState(0);
  const query = useMemo(
    () => ({ entityType: status || undefined }),
    [status],
  );
  const { data, error, loading } = useAdminResource(
    (token) => fetchAdminAuditLogs(token, query),
    [query.entityType, nonce],
  );

  const rows = (data?.items ?? [])
    .filter((item) => {
      if (!q.trim()) return true;
      return JSON.stringify(item).toLowerCase().includes(q.trim().toLowerCase());
    })
    .map((item) => {
      const actor = item.actor as { firstName?: string } | null;
      return {
        key: String(item.id),
        cells: [
          String(item.action),
          String(item.entityType),
          String(item.entityId).slice(0, 8) + '…',
          actor?.firstName ?? 'system',
          String(item.source),
          new Date(String(item.createdAt)).toLocaleString(),
        ],
      };
    });

  return (
    <AdminDataPage
      title="Audit log"
      subtitle="Privileged actions across the platform. Use search to filter by entity or actor."
    >
      <AdminFilterBar
        q={q}
        onQ={setQ}
        status={status}
        onStatus={setStatus}
        statusOptions={[
          'Event',
          'EventRegistration',
          'User',
          'CheckIn',
          'Payment',
        ].map((value) => ({ value, label: value }))}
        onRefresh={() => setNonce((n) => n + 1)}
      />
      <AdminLoadingState
        loading={loading}
        error={error}
        empty={!loading && rows.length === 0}
      >
        <AdminTable
          headers={['Action', 'Entity', 'Entity ID', 'Actor', 'Source', 'When']}
          rows={rows}
        />
      </AdminLoadingState>
    </AdminDataPage>
  );
}
