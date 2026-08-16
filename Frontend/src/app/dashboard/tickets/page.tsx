import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

export default function TicketsPage() {
  return (
    <Stack spacing={1}>
      <Typography variant="h3">My Tickets</Typography>
      <Typography color="text.secondary">
        Confirmed tickets with QR codes from GET /tickets/mine.
      </Typography>
    </Stack>
  );
}
