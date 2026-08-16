'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  ApiError,
  loginWithTelegram,
  type TelegramLoginPayload,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ThemeModeSwitch } from '@/components/ThemeModeSwitch';

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramLoginPayload) => void;
  }
}

export default function LoginPage() {
  const bot =
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'EventBot';
  const widgetHost = useRef<HTMLDivElement | null>(null);
  const { setSession, user, accessToken } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pastedToken, setPastedToken] = useState('');

  useEffect(() => {
    window.onTelegramAuth = (payload: TelegramLoginPayload) => {
      void (async () => {
        setBusy(true);
        setError(null);
        try {
          const result = await loginWithTelegram(payload);
          setSession(result.accessToken, result.user);
          router.push('/dashboard');
        } catch (err) {
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
      })();
    };

    const host = widgetHost.current;
    if (!host) return;
    host.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', bot);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    host.appendChild(script);

    return () => {
      delete window.onTelegramAuth;
    };
  }, [bot, router, setSession]);

  function applyPastedToken() {
    const token = pastedToken.trim();
    if (!token) {
      setError('Paste a JWT access token first.');
      return;
    }
    setSession(token, {
      id: 'session',
      telegramUserId: '0',
      firstName: 'Signed in',
      status: 'APPROVED',
      roles: ['ADMIN', 'VOUCHER'],
    });
    router.push('/dashboard/invitations');
  }

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
              Continue with Telegram for bot @{bot}, or paste a development access
              token from the API.
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

          <Divider>or</Divider>

          <TextField
            label="Access token (local / CI)"
            value={pastedToken}
            onChange={(e) => setPastedToken(e.target.value)}
            placeholder="eyJhbGciOi…"
            multiline
            minRows={2}
          />
          <Button variant="outlined" onClick={applyPastedToken} disabled={busy}>
            Use access token
          </Button>

          <Button component={Link} href="/" color="inherit">
            Back to home
          </Button>
        </Stack>
      </Paper>
      </Box>
    </Box>
  );
}
