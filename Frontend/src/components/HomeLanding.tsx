'use client';

import TelegramIcon from '@mui/icons-material/Telegram';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { MarketingShell } from '@/components/MarketingShell';
import { fetchPublicConfig } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  audiences,
  faqs,
  guestSection,
  hero,
  howItWorksSteps,
  organizerSection,
  privacyPoints,
  trustIntro,
  twoSurfaces,
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
      <Typography
        variant="h3"
        component="p"
        sx={{ fontSize: '1.35rem', mt: 1, mb: 2 }}
      >
        Friday night
      </Typography>
      <Stack
        spacing={1.25}
        divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}
      >
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

function AudienceBand({
  id,
  title,
  points,
  cta,
  tint,
  mock,
}: {
  id: string;
  title: string;
  points: readonly string[];
  cta: ReactNode;
  tint: 'guest' | 'organizer';
  mock: ReactNode;
}) {
  return (
    <Box
      id={id}
      sx={{
        py: { xs: 5, sm: 7 },
        scrollMarginTop: 88,
        bgcolor:
          tint === 'guest'
            ? (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(45, 212, 191, 0.06)'
                  : 'rgba(15, 118, 110, 0.06)'
            : 'action.hover',
        borderTop: 1,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 3, md: 5 },
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.05fr) minmax(0, 0.95fr)' },
            alignItems: 'center',
          }}
        >
          <Stack spacing={2} alignItems="flex-start">
            <Typography
              variant="h2"
              sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' }, maxWidth: 520 }}
            >
              {title}
            </Typography>
            <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.25 }}>
              {points.map((point) => (
                <Typography
                  key={point}
                  component="li"
                  color="text.secondary"
                  sx={{ lineHeight: 1.6 }}
                >
                  {point}
                </Typography>
              ))}
            </Stack>
            {cta}
          </Stack>
          <Box>{mock}</Box>
        </Box>
      </Container>
    </Box>
  );
}

export function HomeLanding({
  botUsername,
}: {
  botUsername?: string | null;
}) {
  const { accessToken, ready } = useAuth();
  const signedIn = ready && Boolean(accessToken);
  const organizeHref = signedIn ? '/dashboard' : '/login';
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
        /* keep guest CTA hidden until we have a real username */
      });
  }, [bot]);

  return (
    <MarketingShell>
      <Box component="main" id="main-content" tabIndex={-1}>
        <Container
          maxWidth="md"
          sx={{ pt: { xs: 7, sm: 11 }, pb: { xs: 6, sm: 8 } }}
        >
          <Stack spacing={3} alignItems="flex-start">
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.4rem', sm: '3.5rem', md: '4rem' },
                lineHeight: 1.05,
                maxWidth: 720,
              }}
            >
              {hero.headline}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{
                fontSize: { xs: '1.05rem', sm: '1.2rem' },
                maxWidth: 540,
                lineHeight: 1.65,
              }}
            >
              {hero.subhead}
            </Typography>
            <Button
              component={Link}
              href={organizeHref}
              variant="contained"
              size="large"
            >
              {signedIn ? 'Open dashboard' : organizerSection.cta}
            </Button>
            <Typography variant="body2" color="text.secondary">
              {hero.note}
            </Typography>
          </Stack>
        </Container>

        <AudienceBand
          id="for-guests"
          title={guestSection.title}
          points={guestSection.points}
          tint="guest"
          mock={<TelegramThread />}
          cta={
            bot ? (
              <Button
                component="a"
                href={telegramBotUrl(bot)}
                target="_blank"
                rel="noopener noreferrer"
                variant="contained"
                size="large"
                startIcon={<TelegramIcon />}
              >
                {guestSection.cta}
              </Button>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Guest access is by invitation in Telegram.
              </Typography>
            )
          }
        />

        <AudienceBand
          id="for-organizers"
          title={organizerSection.title}
          points={organizerSection.points}
          tint="organizer"
          mock={<ConsoleStrip />}
          cta={
            <Button
              component={Link}
              href={organizeHref}
              variant="contained"
              size="large"
            >
              {signedIn ? 'Open dashboard' : organizerSection.cta}
            </Button>
          }
        />

        <Container maxWidth="md" sx={{ py: { xs: 6, sm: 9 } }}>
          <Typography
            variant="h2"
            sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' }, mb: 1.5 }}
          >
            {twoSurfaces.title}
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 560, lineHeight: 1.65 }}>
            {twoSurfaces.body}
          </Typography>
        </Container>

        <Container
          id="how-it-works"
          maxWidth="lg"
          sx={{ pb: { xs: 6, sm: 10 }, scrollMarginTop: 88 }}
        >
          <Typography
            variant="h2"
            sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' }, mb: 3 }}
          >
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
          <Typography
            variant="h2"
            sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' }, mb: 3 }}
          >
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
            <Typography
              variant="h2"
              sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' }, mb: 1 }}
            >
              {trustIntro.title}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 560 }}>
              {trustIntro.body}
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
          <Typography
            variant="h2"
            sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' }, mb: 3 }}
          >
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
