'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { ThemeModeSwitch } from '@/components/ThemeModeSwitch';

export default function HomePage() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        px: { xs: 2, sm: 3 },
        py: 2,
      }}
    >
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <ThemeModeSwitch />
      </Stack>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Stack
          spacing={2.5}
          alignItems="flex-start"
          maxWidth={560}
          width="100%"
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', sm: '3.25rem', md: '3.75rem' },
              lineHeight: 1.05,
              color: 'primary.dark',
            }}
          >
            Eventer
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontSize: { xs: '1rem', sm: '1.125rem' }, maxWidth: 420 }}
          >
            Private, invite-gated events for organizers — registrations, payments,
            and check-in in one console.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.25}
            sx={{ width: { xs: '100%', sm: 'auto' }, pt: 1 }}
          >
            <Button
              component={Link}
              href="/login"
              variant="contained"
              size="large"
              fullWidth
              sx={{ width: { sm: 'auto' } }}
            >
              Sign in
            </Button>
            <Button
              component={Link}
              href="/dashboard"
              variant="outlined"
              size="large"
              fullWidth
              sx={{ width: { sm: 'auto' } }}
            >
              Open dashboard
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
