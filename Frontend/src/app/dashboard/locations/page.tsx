import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

export default function LocationsPage() {
  return (
    <Stack spacing={1}>
      <Typography
        variant="h3"
        sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' } }}
      >
        Locations
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 560 }}>
        Shared venue pool. Addresses stay hidden from attendees until release.
      </Typography>
    </Stack>
  );
}
