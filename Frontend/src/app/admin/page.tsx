'use client';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import {
  AdminDataPage,
  AdminLoadingState,
  useAdminResource,
} from '@/components/admin-ui';
import { fetchAdminOverview, type AdminOverview } from '@/lib/api';

export default function AdminHomePage() {
  const { data, error, loading } = useAdminResource<AdminOverview>((token) =>
    fetchAdminOverview(token),
  );

  const cards: Array<{ label: string; value: string | number }> = data
    ? [
        { label: 'Users', value: data.users },
        { label: 'Organizers', value: data.organizers },
        { label: 'Admins', value: data.admins },
        { label: 'Events', value: data.events },
        { label: 'Open events', value: data.openEvents },
        { label: 'Registrations', value: data.registrations },
        { label: 'Payments', value: data.payments },
        { label: 'Succeeded payments', value: data.succeededPayments },
        {
          label: 'Succeeded volume',
          value: data.succeededPaymentAmount,
        },
        { label: 'Tickets', value: data.tickets },
        { label: 'Check-ins', value: data.checkIns },
        { label: 'Invitations', value: data.invitations },
        { label: 'Waitlist rows', value: data.waitlist },
        { label: 'Audit logs', value: data.auditLogs },
        { label: 'Notifications', value: data.notifications },
      ]
    : [];

  return (
    <AdminDataPage
      title="Platform overview"
      subtitle="Every count across Eventer. Drill into events, users, payments, and more from the sidebar."
    >
      <AdminLoadingState loading={loading} error={error}>
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: {
              xs: '1fr 1fr',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
          }}
        >
          {cards.map((card) => (
            <Paper key={card.label} sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {card.label}
              </Typography>
              <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 650 }}>
                {card.value}
              </Typography>
            </Paper>
          ))}
        </Box>
      </AdminLoadingState>
    </AdminDataPage>
  );
}
