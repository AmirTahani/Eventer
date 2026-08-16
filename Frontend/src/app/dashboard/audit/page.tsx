import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

export default function AuditPage() {
  return (
    <Stack spacing={1}>
      <Typography variant="h3">Audit Logs</Typography>
      <Typography color="text.secondary">
        Filterable privileged-action history (wired in M14).
      </Typography>
    </Stack>
  );
}
