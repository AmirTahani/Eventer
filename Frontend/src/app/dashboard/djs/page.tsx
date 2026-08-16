import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

function Placeholder({ title, blurb }: { title: string; blurb: string }) {
  return (
    <Stack spacing={1}>
      <Typography variant="h3">{title}</Typography>
      <Typography color="text.secondary">{blurb}</Typography>
    </Stack>
  );
}

export default function DjsPage() {
  return (
    <Placeholder
      title="DJs"
      blurb="Shared DJ pool — create and reuse profiles across events."
    />
  );
}
