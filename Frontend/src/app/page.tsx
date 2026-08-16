'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';

export default function HomePage() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
        background:
          'radial-gradient(ellipse at top, #161F35 0%, #070B14 55%)',
      }}
    >
      <Stack spacing={2} alignItems="center" maxWidth={480} textAlign="center">
        <Typography
          variant="h2"
          sx={{ fontFamily: '"Playfair Display", Georgia, serif' }}
        >
          Eventer
        </Typography>
        <Typography color="text.secondary">
          Private, invite-gated event management for organizers and admins.
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button component={Link} href="/login" variant="contained">
            Log in with Telegram
          </Button>
          <Button component={Link} href="/dashboard" variant="outlined">
            Open dashboard
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
