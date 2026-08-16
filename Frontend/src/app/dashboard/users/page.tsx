import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

export default function UsersAdminPage() {
  return (
    <Stack spacing={1}>
      <Typography
        variant="h3"
        sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' } }}
      >
        Users
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 560 }}>
        Admin-only: approve, suspend, and assign roles.
      </Typography>
    </Stack>
  );
}
