import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

export default function DashboardHomePage() {
  return (
    <Stack spacing={1}>
      <Typography variant="h3">Overview</Typography>
      <Typography color="text.secondary">
        Organizer and admin console. Use the sidebar to manage events,
        registrations, check-in, and audit logs.
      </Typography>
    </Stack>
  );
}
