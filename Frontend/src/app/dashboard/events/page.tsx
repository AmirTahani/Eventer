'use client';

import AddIcon from '@mui/icons-material/Add';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Link from 'next/link';
import { MobileFab } from '@/components/MobileFab';
import { PageHeader } from '@/components/PageHeader';

export default function EventsPage() {
  return (
    <Stack spacing={2}>
      <PageHeader
        title="Events"
        subtitle="Events visible to you will load from GET /events once authenticated."
        action={
          <Button
            component={Link}
            href="/dashboard/events/new"
            variant="contained"
          >
            Create Event
          </Button>
        }
      />
      <MobileFab
        href="/dashboard/events/new"
        label="New event"
        icon={<AddIcon sx={{ mr: 0.75 }} />}
      />
    </Stack>
  );
}
