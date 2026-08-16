import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

export default function InvitationsPage() {
  return (
    <Stack spacing={2} alignItems="flex-start">
      <Typography variant="h3">Invitations</Typography>
      <Typography color="text.secondary">
        Create voucher deep links and track acceptance status.
      </Typography>
      <Button variant="contained">New Invitation</Button>
    </Stack>
  );
}
