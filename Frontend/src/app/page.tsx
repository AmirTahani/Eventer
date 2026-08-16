import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';

export default function HomePage() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        px: 3,
        background:
          'radial-gradient(ellipse at top, #161F35 0%, #070B14 55%)',
      }}
    >
      <Typography
        variant="h2"
        component="h1"
        sx={{ fontFamily: '"Playfair Display", Georgia, serif' }}
      >
        Eventer
      </Typography>
      <Typography color="text.secondary" maxWidth={480} textAlign="center">
        Private event management dashboard. Milestone 1 foundation is up —
        auth and organizer flows arrive in later milestones.
      </Typography>
      <Link href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/health`}>
        API health
      </Link>
    </Box>
  );
}
