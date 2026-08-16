import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

export default function LocationsPage() {
  return (
    <Stack spacing={1}>
      <Typography variant="h3">Locations</Typography>
      <Typography color="text.secondary">
        Shared venue pool. Addresses stay hidden from attendees until release.
      </Typography>
    </Stack>
  );
}
