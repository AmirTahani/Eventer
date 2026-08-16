import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

export default function UsersAdminPage() {
  return (
    <Stack spacing={1}>
      <Typography variant="h3">Users</Typography>
      <Typography color="text.secondary">
        Admin-only: approve, suspend, and assign roles.
      </Typography>
    </Stack>
  );
}
