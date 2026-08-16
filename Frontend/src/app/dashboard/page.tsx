'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function DashboardHomePage() {
  const { user, ready } = useAuth();

  return (
    <Stack spacing={3}>
      <Box>
        <Typography
          variant="h3"
          sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' } }}
        >
          Overview
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 560 }}>
          {ready && user
            ? `Welcome back, ${user.firstName}. Manage events, invitations, and check-in from the sidebar.`
            : 'Organizer and admin console. Sign in to create invitations and manage events.'}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
        }}
      >
        {[
          {
            title: 'Events',
            body: 'Create and publish private events with capacity and pricing.',
            href: '/dashboard/events',
          },
          {
            title: 'Invitations',
            body: 'Issue Telegram deep links for new guests.',
            href: '/dashboard/invitations',
          },
          {
            title: 'Tickets',
            body: 'View issued tickets after confirmed registrations.',
            href: '/dashboard/tickets',
          },
        ].map((card) => (
          <Paper
            key={card.href}
            component={Link}
            href={card.href}
            sx={{
              p: 2.5,
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              '&:hover': {
                borderColor: 'primary.main',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
              },
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              {card.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {card.body}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Stack>
  );
}
