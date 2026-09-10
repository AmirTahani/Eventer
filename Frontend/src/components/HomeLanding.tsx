'use client';

import TelegramIcon from '@mui/icons-material/Telegram';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MarketingShell } from '@/components/MarketingShell';
import { fetchPublicConfig } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  audiences,
  faqs,
  howItWorksSteps,
  privacyPoints,
} from '@/lib/marketing-content';
import {
  normalizeTelegramBotUsername,
  telegramBotUrl,
} from '@/lib/telegram';

function TelegramThread() {
  const bubbles = [
    {
      from: 'host' as const,
      text: "You're invited. Friday night, 80 people. Register in this chat.",
    },
    {
      from: 'guest' as const,
      text: 'Seat held. Paying now.',
    },
    {
      from: 'host' as const,
      text: 'Ticket is here. Address when the host releases it — not before.',
    },
  ];

  return (
    <Paper sx={{ p: { xs: 2.5, sm: 3 }, height: '100%' }}>
      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
        Guests · Telegram
      </Typography>
      <Stack spacing={1.25} sx={{ mt: 2 }}>
        {bubbles.map((bubble) => (
          <Box
            key={bubble.text}
            sx={{
              alignSelf: bubble.from === 'guest' ? 'flex-end' : 'flex-start',
              maxWidth: '88%',
              px: 1.75,
              py: 1.25,
              borderRadius: 2,
              bgcolor:
                bubble.from === 'guest' ? 'primary.main' : 'action.hover',
              color:
                bubble.from === 'guest' ? 'primary.contrastText' : 'text.primary',
            }}
          >
            <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
              {bubble.text}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

function ConsoleStrip() {
  const rows = [
    ['Confirmed', '64 / 80'],
    ['Waitlist', '11'],
    ['Location', 'Hidden'],
    ['Last check-in', '2 min ago'],
  ];

  return (
    <Paper sx={{ p: { xs: 2.5, sm: 3 }, height: '100%' }}>
      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
        Hosts · Console
      </Typography>
      <Typography variant="h3" component="p" sx={{ fontSize: '1.35rem', mt: 1, mb: 2 }}>
        Friday night
      </Typography>
      <Stack spacing={1.25} divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
        {rows.map(([label, value]) => (
          <Box
            key={label}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 2,
              py: 0.5,
            }}
          >
            <Typography color="text.secondary">{label}</Typography>
            <Typography fontWeight={600}>{value}</Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

export function HomeLanding({
  botUsername,
}: {
  botUsername?: string | null;
}) {
  const { accessToken, ready } = useAuth();
  const signedIn = ready && Boolean(accessToken);
  const [bot, setBot] = useState(
    () =>
      normalizeTelegramBotUsername(botUsername) ??
      normalizeTelegramBotUsername(
        process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME,
      ),
  );

  useEffect(() => {
    if (bot) return;
    void fetchPublicConfig()
      .then((config) => {
        const name = normalizeTelegramBotUsername(config.telegramBotUsername);
        if (name) setBot(name);
      })
      .catch(() => {
        /* keep the CTA hidden until we have a real username */
      });
  }, [bot]);

  return (
    <MarketingShell>
      <Box component="main" id="main-content" tabIndex={-1}>
        <Container
          maxWidth="lg"
          sx={{ pt: { xs: 6, sm: 10 }, pb: { xs: 6, sm: 10 } }}
        >
          <Box
            sx={{
              display: 'grid',
              gap: { xs: 3, md: 2 },
              rowGap: { md: 2 },
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.1fr) minmax(0, 0.9fr)' },
              gridTemplateAreas: {
                xs: '"hero" "telegram" "console"',
                md: '"hero telegram" "copy console"',
              },
              alignItems: 'stretch',
            }}
          >
            <Stack spacing={3} alignItems="flex-start" sx={{ gridArea: 'hero', pb: { md: 4 } }}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.4rem', sm: '3.4rem', md: '4rem' },
                  lineHeight: 1.05,
                  maxWidth: 640,
                }}
              >
                The room stays closed until you open it.
              </Typography>
              <Typography
                color="text.secondary"
                sx={{
                  fontSize: { xs: '1.05rem', sm: '1.2rem' },
                  maxWidth: 520,
                  lineHeight: 1.65,
                }}
              >
                Guests register and pay in Telegram. You run the door from the
                web. The address stays hidden until you release it.
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
                  {signedIn ? 'Open dashboard' : 'Hosts sign in'}
                </Button>
                {bot ? (
                  <Button
                    component="a"
                    href={telegramBotUrl(bot)}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    size="large"
                    fullWidth
                    startIcon={<TelegramIcon />}
                    sx={{ width: { sm: 'auto' } }}
                  >
                    Open Telegram
                  </Button>
                ) : null}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                No public signup. Guests need an invitation.
              </Typography>
            </Stack>
            <Box sx={{ gridArea: 'telegram' }}>
              <TelegramThread />
            </Box>
            <Box sx={{ gridArea: 'console' }}>
              <ConsoleStrip />
            </Box>
            <Paper
              sx={{
                gridArea: 'copy',
                p: { xs: 3, sm: 4 },
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h2" sx={{ fontSize: '1.75rem', mb: 1.5 }}>
                Two surfaces. One closed room.
              </Typography>
              <Typography color="text.secondary">
                Guests never install another app. Hosts get capacity, waitlist,
                location release, and check-in in the console — with an audit
                trail behind privileged actions.
              </Typography>
            </Paper>
          </Box>
        </Container>

        <Container
          id="how-it-works"
          maxWidth="lg"
          sx={{ pb: { xs: 6, sm: 10 }, scrollMarginTop: 88 }}
        >
          <Typography variant="h2" sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' }, mb: 3 }}>
            Invite, register, arrive
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gap: { xs: 3, md: 5 },
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            }}
          >
            {howItWorksSteps.map((step, index) => (
              <Box key={step.title}>
                <Typography color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                  {index + 1}
                </Typography>
                <Typography variant="h3" sx={{ fontSize: '1.35rem', mb: 1 }}>
                  {step.title}
                </Typography>
                <Typography color="text.secondary">{step.body}</Typography>
              </Box>
            ))}
          </Box>
        </Container>

        <Container maxWidth="lg" sx={{ pb: { xs: 6, sm: 10 } }}>
          <Typography variant="h2" sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' }, mb: 3 }}>
            Built for rooms that should stay private
          </Typography>
          <Box
            component="ul"
            sx={{
              display: 'grid',
              gap: { xs: 3, md: 5 },
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              listStyle: 'none',
              p: 0,
              m: 0,
            }}
          >
            {audiences.map((item) => (
              <Box component="li" key={item.title}>
                <Typography variant="h3" sx={{ fontSize: '1.35rem', mb: 1 }}>
                  {item.title}
                </Typography>
                <Typography color="text.secondary">{item.body}</Typography>
              </Box>
            ))}
          </Box>
        </Container>

        <Container maxWidth="lg" sx={{ pb: { xs: 6, sm: 10 } }}>
          <Paper sx={{ p: { xs: 3, sm: 5 } }}>
            <Typography variant="h2" sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' }, mb: 1 }}>
              An unlisted link is not private
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 560 }}>
              Anyone who forwards an Eventbrite or Luma URL can register. Eventer
              does not work that way.
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 3,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              }}
            >
              {privacyPoints.map((item) => (
                <Box key={item.title}>
                  <Typography variant="h3" sx={{ fontSize: '1.2rem', mb: 1 }}>
                    {item.title}
                  </Typography>
                  <Typography color="text.secondary">{item.body}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Container>

        <Container
          id="faq"
          maxWidth="md"
          sx={{ pb: { xs: 8, sm: 12 }, scrollMarginTop: 88 }}
        >
          <Typography variant="h2" sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' }, mb: 3 }}>
            Questions
          </Typography>
          <Stack spacing={3}>
            {faqs.map((item) => (
              <Box key={item.question} component="section">
                <Typography variant="h3" sx={{ fontSize: '1.15rem', mb: 0.75 }}>
                  {item.question}
                </Typography>
                <Typography color="text.secondary">{item.answer}</Typography>
              </Box>
            ))}
          </Stack>
        </Container>
      </Box>
    </MarketingShell>
  );
}
