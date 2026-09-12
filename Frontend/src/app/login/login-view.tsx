'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  ApiError,
  fetchPublicConfig,
  loginWithTelegram,
  type TelegramLoginPayload,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ThemeModeSwitch } from '@/components/ThemeModeSwitch';
import {
  canAccessAdminConsole,
  canAccessOrganizerConsole,
} from '@/lib/hosts';
import {
  normalizeTelegramBotUsername,
  parseTelegramLoginSearch,
} from '@/lib/telegram';

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramLoginPayload) => void;
  }
}

export function LoginView({
  botUsername,
  audience = 'organizer',
}: {
  botUsername?: string | null;
  audience?: 'organizer' | 'admin';
}) {
  const [bot, setBot] = useState(
    () =>
      normalizeTelegramBotUsername(botUsername) ??
      normalizeTelegramBotUsername(
        process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME,
      ),
  );
  const widgetHost = useRef<HTMLDivElement | null>(null);
  const { setSession, clearSession, accessToken, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const denied = searchParams.get('denied') === '1';
  const [error, setError] = useState<string | null>(
    denied
      ? audience === 'admin'
        ? 'Admin access required. Guests and organizers cannot use this panel.'
        : 'Organizer access required. Guests use Telegram — this console is for hosts.'
      : null,
  );
  const [busy, setBusy] = useState(false);
  const completingRef = useRef(false);

  const successHref = audience === 'admin' ? '/admin' : '/dashboard';
  const title = audience === 'admin' ? 'Admin sign in' : 'Host sign in';
  const blurb =
    audience === 'admin'
      ? 'Telegram Login for Eventer administrators only. Guests stay in Telegram; organizers use the host console.'
      : 'Telegram Login for organizers and admins. Guests never need this page — they register in the bot.';

  async function completeLogin(payload: TelegramLoginPayload) {
    if (completingRef.current) return;
    completingRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await loginWithTelegram(payload);
      const roles = result.user.roles;
      const allowed =
        audience === 'admin'
          ? canAccessAdminConsole(roles)
          : canAccessOrganizerConsole(roles);
      if (!allowed) {
        clearSession();
        setError(
          audience === 'admin'
            ? 'This Telegram account is not an admin.'
            : 'This Telegram account is not an organizer or admin. Guests use the Telegram bot.',
        );
        completingRef.current = false;
        return;
      }
      setSession(result.accessToken, result.user);
      router.replace(successHref);
    } catch (err) {
      completingRef.current = false;
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Login failed',
      );
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const fromRedirect = parseTelegramLoginSearch(window.location.search);
    if (fromRedirect) {
      window.history.replaceState(
        {},
        '',
        audience === 'admin' ? '/admin/login' : '/login',
      );
      void completeLogin(fromRedirect);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount for Telegram redirect
  }, []);

  useEffect(() => {
    if (bot) return;
    void fetchPublicConfig()
      .then((config) => {
        const name = normalizeTelegramBotUsername(config.telegramBotUsername);
        if (name) {
          setBot(name);
          return;
        }
        setError(
          'Telegram bot username is missing on the API. Set TELEGRAM_BOT_USERNAME.',
        );
      })
      .catch(() => {
        setError(
          'Could not load the Telegram bot username. Check that the API is reachable and CORS_ORIGIN includes this site.',
        );
      });
  }, [bot]);

  useEffect(() => {
    window.onTelegramAuth = (payload: TelegramLoginPayload) => {
      void completeLogin(payload);
    };

    const host = widgetHost.current;
    if (!host || !bot) return;
    host.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', bot);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute(
      'data-auth-url',
      `${window.location.origin}${audience === 'admin' ? '/admin/login' : '/login'}`,
    );
    host.appendChild(script);

    return () => {
      delete window.onTelegramAuth;
    };
  }, [bot, audience]);

  const alreadySignedIn =
    accessToken &&
    user &&
    (audience === 'admin'
      ? canAccessAdminConsole(user.roles)
      : canAccessOrganizerConsole(user.roles));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        px: 2,
        py: 2,
      }}
    >
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <ThemeModeSwitch />
      </Stack>
      <Box
        sx={{
          flex: 1,
          display: 'grid',
          placeItems: 'center',
          py: 2,
        }}
      >
        <Paper
          sx={{
            p: { xs: 3, sm: 4 },
            maxWidth: 440,
            width: '100%',
          }}
        >
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="overline" color="primary" sx={{ fontWeight: 700 }}>
                {audience === 'admin' ? 'Admin panel' : 'Organizer console'}
              </Typography>
              <Typography variant="h4" gutterBottom>
                {title}
              </Typography>
              <Typography color="text.secondary">{blurb}</Typography>
            </Box>

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {alreadySignedIn && (
              <Alert severity="success">
                You already have a session.{' '}
                <Link href={successHref}>Open {audience === 'admin' ? 'admin' : 'dashboard'}</Link>
              </Alert>
            )}

            <Box
              ref={widgetHost}
              sx={{
                minHeight: 48,
                display: 'grid',
                placeItems: 'center',
                opacity: busy ? 0.6 : 1,
              }}
            />

            {!bot && !error ? (
              <Typography color="text.secondary" variant="body2">
                Loading Telegram Login…
              </Typography>
            ) : null}

            <Typography variant="body2" color="text.secondary">
              Guests: open the Telegram bot for invites and tickets. This page
              is not a guest signup.
            </Typography>

            <Button
              component={Link}
              href={audience === 'admin' ? 'https://eventer.world' : '/'}
              color="inherit"
            >
              Back to home
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
