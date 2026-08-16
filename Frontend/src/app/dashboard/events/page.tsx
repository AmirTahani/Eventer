'use client';

import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Link from 'next/link';

export default function EventsPage() {
  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
      >
        <Typography
          variant="h3"
          sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' } }}
        >
          Events
        </Typography>
        <Button
          component={Link}
          href="/dashboard/events/new"
          variant="contained"
          sx={{ alignSelf: { xs: 'stretch', sm: 'center' } }}
        >
          Create Event
        </Button>
      </Stack>
      <Typography color="text.secondary">
        Events visible to you will load from GET /events once authenticated.
      </Typography>
    </Stack>
  );
}
