import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Link from 'next/link';

export default function EventsPage() {
  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h3">Events</Typography>
        <Button component={Link} href="/dashboard/events/new" variant="contained">
          Create Event
        </Button>
      </Stack>
      <Typography color="text.secondary">
        Events visible to you will load from GET /events once authenticated.
      </Typography>
    </Stack>
  );
}
