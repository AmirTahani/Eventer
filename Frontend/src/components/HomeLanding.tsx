'use client';

import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import PolicyOutlinedIcon from '@mui/icons-material/PolicyOutlined';
import TelegramIcon from '@mui/icons-material/Telegram';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import type { SvgIconComponent } from '@mui/icons-material';
import { ThemeModeSwitch } from '@/components/ThemeModeSwitch';
import { useAuth } from '@/lib/auth';

const steps = [
  {
    n: '01',
    title: 'Invite',
    body: 'A voucher sends a Telegram deep link. There is no public signup — if you were not invited, Eventer stays closed.',
  },
  {
    n: '02',
    title: 'Register',
    body: 'Guests pick seats, pay if the event requires it, and receive a ticket in chat. Capacity is reserved as they go.',
  },
  {
    n: '03',
    title: 'Arrive',
    body: 'Organizers check in at the door. The venue stays hidden until you release it to confirmed guests.',
  },
];

const features: { title: string; body: string; icon: SvgIconComponent }[] = [
  {
    title: 'Nothing visible by default',
    body: 'Events, guest lists, and locations stay hidden unless the person asking is authorized to see them.',
    icon: VisibilityOffOutlinedIcon,
  },
  {
    title: 'Invite-gated entry',
    body: 'Identity is Telegram ID. Access starts with a voucher — not a signup form on the open web.',
    icon: VerifiedUserOutlinedIcon,
  },
  {
    title: 'Race-safe capacity',
    body: 'Pending payments hold seats. Waitlists promote automatically when a spot opens.',
    icon: LockOutlinedIcon,
  },
  {
    title: 'Payments that lock a seat',
    body: 'Checkout happens in Telegram. The ticket is issued only after payment confirms.',
    icon: PaymentsOutlinedIcon,
  },
  {
    title: 'Location on a one-way gate',
    body: 'Release the address when you are ready. Confirmed guests see it; everyone else does not.',
    icon: PlaceOutlinedIcon,
  },
  {
    title: 'Tickets, check-in, audit',
    body: 'QR tickets at the door, and a log of every privileged action in the organizer console.',
    icon: PolicyOutlinedIcon,
  },
];

export function HomeLanding() {
  const { accessToken, ready } = useAuth();
  const signedIn = ready && Boolean(accessToken);
  const bot =
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'EventBot';

  return (
    <Box
      component="main"
      sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 1.5, minHeight: { xs: 64, sm: 72 } }}>
          <Typography
            variant="h6"
            component={Link}
            href="/"
            sx={{
              color: 'inherit',
              textDecoration: 'none',
              letterSpacing: '-0.02em',
            }}
          >
            Eventer
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button
            component="a"
            href="#how-it-works"
            color="inherit"
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            How it works
          </Button>
          <Button
            component={Link}
            href={signedIn ? '/dashboard' : '/login'}
            variant="contained"
            size="small"
          >
            {signedIn ? 'Dashboard' : 'Sign in'}
          </Button>
          <ThemeModeSwitch />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ pt: { xs: 6, sm: 10 }, pb: { xs: 6, sm: 8 } }}>
        <Stack spacing={3} alignItems="flex-start">
          <Chip
            icon={<LockOutlinedIcon />}
            label="Invite only"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.25rem' },
              lineHeight: 1.05,
              maxWidth: 720,
            }}
          >
            Private events, from invite to the door.
          </Typography>
          <Typography
            color="text.secondary"
            sx={{
              fontSize: { xs: '1.05rem', sm: '1.2rem' },
              maxWidth: 540,
              lineHeight: 1.65,
            }}
          >
            Guests register and pay in Telegram. Organizers run the room from a
            web console. Nothing is public unless someone is meant to see it.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.25}
            sx={{ width: { xs: '100%', sm: 'auto' }, pt: 1 }}
          >
            <Button
              component={Link}
              href={signedIn ? '/dashboard' : '/login'}
              variant="contained"
              size="large"
              fullWidth
              sx={{ width: { sm: 'auto' } }}
            >
              {signedIn ? 'Open dashboard' : 'Organizer sign in'}
            </Button>
            <Button
              component="a"
              href={`https://t.me/${bot}`}
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              size="large"
              fullWidth
              startIcon={<TelegramIcon />}
              sx={{ width: { sm: 'auto' } }}
            >
              Telegram bot
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            The bot will not open events to you without an invitation.
          </Typography>
        </Stack>
      </Container>

      <Container
        id="how-it-works"
        maxWidth="lg"
        sx={{ pb: { xs: 6, sm: 10 }, scrollMarginTop: 88 }}
      >
        <Typography variant="overline" color="primary" sx={{ fontWeight: 700 }}>
          How it works
        </Typography>
        <Typography variant="h2" sx={{ mt: 1, mb: 3, fontSize: { xs: '1.75rem', sm: '2.25rem' } }}>
          Three steps. Closed by default.
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          }}
        >
          {steps.map((step) => (
            <Paper key={step.n} sx={{ p: { xs: 2.5, sm: 3 }, height: '100%' }}>
              <Typography
                variant="overline"
                color="primary"
                sx={{ fontWeight: 700, letterSpacing: '0.12em' }}
              >
                {step.n}
              </Typography>
              <Typography variant="h5" sx={{ mt: 1, mb: 1 }}>
                {step.title}
              </Typography>
              <Typography color="text.secondary">{step.body}</Typography>
            </Paper>
          ))}
        </Box>
      </Container>

      <Container maxWidth="lg" sx={{ pb: { xs: 6, sm: 10 } }}>
        <Typography variant="overline" color="primary" sx={{ fontWeight: 700 }}>
          The platform
        </Typography>
        <Typography variant="h2" sx={{ mt: 1, mb: 3, fontSize: { xs: '1.75rem', sm: '2.25rem' } }}>
          Built for rooms that should stay private.
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' },
          }}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Paper key={feature.title} sx={{ p: { xs: 2.5, sm: 3 }, height: '100%' }}>
                <Icon sx={{ color: 'primary.main', mb: 1.5, fontSize: 28 }} />
                <Typography variant="h6" sx={{ mb: 0.75 }}>
                  {feature.title}
                </Typography>
                <Typography color="text.secondary">{feature.body}</Typography>
              </Paper>
            );
          })}
        </Box>
      </Container>

      <Container maxWidth="lg" sx={{ pb: { xs: 6, sm: 10 } }}>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          }}
        >
          <Paper sx={{ p: { xs: 3, sm: 4 } }}>
            <TelegramIcon sx={{ color: 'primary.main', mb: 1.5 }} />
            <Typography variant="h4" sx={{ mb: 1 }}>
              Guests live in Telegram
            </Typography>
            <Typography color="text.secondary">
              Events, registrations, tickets, and waitlist claims happen in chat —
              the surface people already have open. No extra app to install.
            </Typography>
          </Paper>
          <Paper sx={{ p: { xs: 3, sm: 4 } }}>
            <ConfirmationNumberOutlinedIcon sx={{ color: 'primary.main', mb: 1.5 }} />
            <Typography variant="h4" sx={{ mb: 1 }}>
              Organizers get a console
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2.5 }}>
              Create events, issue invitations, release location, and check in
              guests from the web — with an audit trail behind every privileged
              action.
            </Typography>
            <Button
              component={Link}
              href={signedIn ? '/dashboard' : '/login'}
              variant="contained"
            >
              {signedIn ? 'Open dashboard' : 'Sign in to the console'}
            </Button>
          </Paper>
        </Box>
      </Container>

      <Box
        component="footer"
        sx={{
          mt: 'auto',
          borderTop: 1,
          borderColor: 'divider',
          py: 3,
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Eventer · eventer.world
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Private events. Invite only.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
