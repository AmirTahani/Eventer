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
import { fetchAdminEvent } from '@/lib/api';

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

export default function AdminEventDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, error, loading } = useAdminResource(
    (token) => fetchAdminEvent(token, id),
    [id],
  );

  return (
    <AdminDataPage
      title={(data?.name as string) ?? 'Event'}
      subtitle="Full event record: organizer, location, registrations, payments, tickets, waitlist, check-ins."
    >
      <AdminLoadingState loading={loading} error={error}>
        {data ? (
          <Stack spacing={2}>
            <Alert severity="info">
              <Link href="/admin/events">← All events</Link>
            </Alert>
            <Section title="Core">
              <Kv label="ID" value={String(data.id)} />
              <Kv label="Status" value={String(data.status)} />
              <Kv label="Visibility" value={String(data.visibilityMode)} />
              <Kv
                label="Start"
                value={new Date(String(data.startAt)).toLocaleString()}
              />
              <Kv
                label="End"
                value={new Date(String(data.endAt)).toLocaleString()}
              />
              <Kv label="Capacity" value={String(data.capacity)} />
              <Kv label="Price" value={`${data.price} ${data.currency}`} />
              <Kv
                label="Location released"
                value={
                  data.locationReleasedAt
                    ? new Date(String(data.locationReleasedAt)).toLocaleString()
                    : 'Hidden'
                }
              />
              <Kv label="Description" value={String(data.description ?? '—')} />
              <Kv label="Rules" value={String(data.rules ?? '—')} />
            </Section>

            <Section title="Organizer">
              {(() => {
                const org = data.organizer as Record<string, unknown>;
                return (
                  <>
                    <Kv
                      label="Name"
                      value={
                        <Link href={`/admin/users/${org.id}`}>
                          {String(org.firstName)} {String(org.lastName ?? '')}
                        </Link>
                      }
                    />
                    <Kv
                      label="Telegram"
                      value={
                        org.telegramUsername
                          ? `@${org.telegramUsername}`
                          : String(org.telegramUserId)
                      }
                    />
                    <Kv
                      label="Roles"
                      value={(org.roles as string[])?.join(', ') ?? '—'}
                    />
                  </>
                );
              })()}
            </Section>

            <Section title="Location">
              {data.location ? (
                (() => {
                  const loc = data.location as Record<string, unknown>;
                  return (
                    <>
                      <Kv label="Venue" value={String(loc.venueName)} />
                      <Kv label="Address" value={String(loc.address)} />
                      <Kv label="Maps" value={String(loc.googleMapsUrl ?? '—')} />
                    </>
                  );
                })()
              ) : (
                <Typography color="text.secondary">No location set.</Typography>
              )}
            </Section>

            <Section
              title={`Registrations (${(data.registrations as unknown[]).length})`}
            >
              <Stack spacing={1.5}>
                {(data.registrations as Array<Record<string, unknown>>).map(
                  (reg) => {
                    const user = reg.primaryUser as Record<string, unknown>;
                    const payments = reg.payments as Array<
                      Record<string, unknown>
                    >;
                    const tickets = reg.tickets as Array<Record<string, unknown>>;
                    return (
                      <Paper
                        key={String(reg.id)}
                        variant="outlined"
                        sx={{ p: 1.5 }}
                      >
                        <Typography fontWeight={600}>
                          <Link href={`/admin/users/${user.id}`}>
                            {String(user.firstName)}
                          </Link>{' '}
                          · {String(reg.status)} · {String(reg.peopleCount)}{' '}
                          people · {String(reg.priceSnapshot)}{' '}
                          {String(reg.currency)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Payments:{' '}
                          {payments
                            .map(
                              (p) =>
                                `${p.status} ${p.amount} ${p.currency} (${p.provider})`,
                            )
                            .join(' · ') || 'none'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Tickets:{' '}
                          {tickets
                            .map((t) => `${t.holderType}:${t.status}`)
                            .join(' · ') || 'none'}
                        </Typography>
                      </Paper>
                    );
                  },
                )}
              </Stack>
            </Section>

            <Section
              title={`Waitlist (${(data.waitlistEntries as unknown[]).length})`}
            >
              <Stack spacing={1}>
                {(data.waitlistEntries as Array<Record<string, unknown>>).map(
                  (row) => {
                    const user = row.user as Record<string, unknown>;
                    return (
                      <Typography key={String(row.id)} variant="body2">
                        #{String(row.position)} {String(user.firstName)} ·{' '}
                        {String(row.status)} · {String(row.peopleCount)} people
                      </Typography>
                    );
                  },
                )}
              </Stack>
            </Section>

            <Section
              title={`Check-ins (${(data.checkIns as unknown[]).length})`}
            >
              <Stack spacing={1}>
                {(data.checkIns as Array<Record<string, unknown>>).map(
                  (row) => {
                    const by = row.checkedInBy as Record<string, unknown>;
                    return (
                      <Typography key={String(row.id)} variant="body2">
                        {new Date(String(row.checkedInAt)).toLocaleString()} ·{' '}
                        {String(row.method)} · by {String(by.firstName)} ·
                        ticket {String(row.ticketStatus)}
                      </Typography>
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
