import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

export default function TicketsPage() {
  return (
    <Stack spacing={1}>
      <Typography
        variant="h3"
        sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' } }}
      >
        My Tickets
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 560 }}>
        Confirmed tickets with QR codes from GET /tickets/mine.
      </Typography>
    </Stack>
  );
}
