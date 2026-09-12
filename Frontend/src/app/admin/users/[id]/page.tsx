'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  AdminDataPage,
  AdminLoadingState,
  useAdminResource,
} from '@/components/admin-ui';
import { fetchAdminUser } from '@/lib/api';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper sx={{ p: 2.5 }}>
      <Typography variant="h6" sx={{ mb: 1.5, fontSize: '1.1rem' }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

function Kv({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack direction="row" spacing={1} sx={{ py: 0.5 }}>
      <Typography color="text.secondary" sx={{ minWidth: 160 }}>
        {label}
      </Typography>
      <Typography sx={{ wordBreak: 'break-word' }}>{value}</Typography>
    </Stack>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, error, loading } = useAdminResource(
    (token) => fetchAdminUser(token, id),
    [id],
  );

  const roles = (data?.roles as Array<{ role: string }> | undefined)
    ?.map((r) => r.role)
    .join(', ');

  return (
    <AdminDataPage
      title={
        data
          ? `${data.firstName}${data.lastName ? ` ${data.lastName}` : ''}`
          : 'User'
      }
      subtitle="Full user dossier: roles, organized events, registrations, payments, invitations, notifications, audit."
    >
      <AdminLoadingState loading={loading} error={error}>
        {data ? (
          <Stack spacing={2}>
            <Alert severity="info">
              <Link href="/admin/users">← All users</Link>
            </Alert>
            <Section title="Profile">
              <Kv label="ID" value={String(data.id)} />
              <Kv label="Telegram ID" value={String(data.telegramUserId)} />
              <Kv
                label="Username"
                value={
                  data.telegramUsername
                    ? `@${data.telegramUsername}`
                    : '—'
                }
              />
              <Kv label="Status" value={String(data.status)} />
              <Kv label="Roles" value={roles || 'GUEST (no console role)'} />
              <Kv label="Locale" value={String(data.locale)} />
              <Kv
                label="Created"
                value={new Date(String(data.createdAt)).toLocaleString()}
              />
            </Section>

            <Section
              title={`Organized events (${(data.eventsOrganized as unknown[]).length})`}
            >
              <Stack spacing={1}>
                {(data.eventsOrganized as Array<Record<string, unknown>>).map(
                  (event) => (
                    <Typography key={String(event.id)} variant="body2">
                      <Link href={`/admin/events/${event.id}`}>
                        {String(event.name)}
                      </Link>{' '}
                      · {String(event.status)} · {String(event.price)}{' '}
                      {String(event.currency)}
                    </Typography>
                  ),
                )}
              </Stack>
            </Section>

            <Section
              title={`Registrations (${(data.registrations as unknown[]).length})`}
            >
              <Stack spacing={1.25}>
                {(data.registrations as Array<Record<string, unknown>>).map(
                  (reg) => {
                    const event = reg.event as Record<string, unknown>;
                    const payments = reg.payments as Array<
                      Record<string, unknown>
                    >;
                    return (
                      <Paper
                        key={String(reg.id)}
                        variant="outlined"
                        sx={{ p: 1.5 }}
                      >
                        <Typography fontWeight={600}>
                          <Link href={`/admin/events/${event.id}`}>
                            {String(event.name)}
                          </Link>{' '}
                          · {String(reg.status)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {payments
                            .map((p) => `${p.status} ${p.amount} ${p.currency}`)
                            .join(' · ') || 'No payments'}
                        </Typography>
                      </Paper>
                    );
                  },
                )}
              </Stack>
            </Section>

            <Section title="Raw JSON">
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 1.5,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  overflow: 'auto',
                  fontSize: 12,
                  maxHeight: 420,
                }}
              >
                {JSON.stringify(data, null, 2)}
              </Box>
            </Section>
          </Stack>
        ) : null}
      </AdminLoadingState>
    </AdminDataPage>
  );
}
