'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
}: {
  botUsername?: string | null;
}) {
  const [bot, setBot] = useState(
    () =>
      normalizeTelegramBotUsername(botUsername) ??
      normalizeTelegramBotUsername(
        process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME,
      ),
  );
  const widgetHost = useRef<HTMLDivElement | null>(null);
  const { setSession, accessToken } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const completingRef = useRef(false);

  async function completeLogin(payload: TelegramLoginPayload) {
    if (completingRef.current) return;
    completingRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await loginWithTelegram(payload);
      setSession(result.accessToken, result.user);
      router.replace('/dashboard');
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
      window.history.replaceState({}, '', '/login');
      void completeLogin(fromRedirect);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount for Telegram redirect
  }, []);

  useEffect(() => {
    if (bot) return;
    void fetchPublicConfig()
      .then((config) => {
        const name = normalizeTelegramBotUsername(config.telegramBotUsername);
        if (name) setBot(name);
      })
      .catch(() => {
        setError(
          'Could not load the Telegram bot username. Check that the API is reachable.',
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
    script.setAttribute('data-auth-url', `${window.location.origin}/login`);
    host.appendChild(script);

    return () => {
      delete window.onTelegramAuth;
    };
  }, [bot, router, setSession]);

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
              <Typography variant="h4" gutterBottom>
                Sign in
              </Typography>
              <Typography color="text.secondary">
                Use Telegram Login with the account that was invited
                {bot ? ` (@${bot})` : ''}.
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {accessToken && (
              <Alert severity="success">
                You already have a session.{' '}
                <Link href="/dashboard">Open dashboard</Link>
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
              If the button is missing, in BotFather set the bot domain to this
              site (eventer.world) under Bot Settings → Domain.
            </Typography>

            <Button component={Link} href="/" color="inherit">
              Back to home
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
