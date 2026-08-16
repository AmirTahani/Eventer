import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

export default function AuditPage() {
  return (
    <Stack spacing={1}>
      <Typography
        variant="h3"
        sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' } }}
      >
        Audit Logs
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 560 }}>
        Filterable privileged-action history.
      </Typography>
    </Stack>
  );
}
