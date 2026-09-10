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
    <Stack spacing={{ xs: 2, md: 3 }}>
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Typography variant="h5" sx={{ fontWeight: 650, letterSpacing: '-0.02em' }}>
          {ready && user ? `Hi, ${user.firstName}` : 'Welcome'}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: '0.95rem' }}>
          {ready && user
            ? 'Jump back into events, invites, and tickets.'
            : 'Sign in to manage events and invitations.'}
        </Typography>
      </Box>

      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Typography variant="h3" sx={{ fontSize: '2.25rem' }}>
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
          gap: 1.5,
          gridTemplateColumns: {
            xs: '1fr 1fr',
            md: 'repeat(3, 1fr)',
          },
        }}
      >
        {[
          {
            title: 'Events',
            body: 'Create and publish private events.',
            href: '/dashboard/events',
          },
          {
            title: 'Invitations',
            body: 'Issue Telegram deep links.',
            href: '/dashboard/invitations',
          },
          {
            title: 'Tickets',
            body: 'View confirmed tickets.',
            href: '/dashboard/tickets',
          },
        ].map((card) => (
          <Paper
            key={card.href}
            component={Link}
            href={card.href}
            sx={{
              p: { xs: 1.75, sm: 2.5 },
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
              minHeight: { xs: 108, md: 'auto' },
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              '&:hover': {
                borderColor: 'primary.main',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
              },
              '&:active': { transform: { xs: 'scale(0.98)', md: 'none' } },
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
