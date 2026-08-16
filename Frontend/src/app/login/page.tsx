'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';

/**
 * Telegram Login Widget mounts here in production via the bot username.
 * For local MVP we document the POST /auth/telegram-login contract.
 */
export default function LoginPage() {
  const bot =
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'EventBot';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        background:
          'radial-gradient(ellipse at top, #161F35 0%, #070B14 55%)',
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 420, width: '100%' }}>
        <Stack spacing={2}>
          <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif' }}>
            Sign in
          </Typography>
          <Typography color="text.secondary">
            Use the Telegram Login Widget for bot @{bot}. The widget posts a signed
            payload to POST /auth/telegram-login.
          </Typography>
          <Alert severity="info">
            Embed the official Telegram widget script in production. Locally, call
            the auth API with a signed test payload.
          </Alert>
          <Box
            id="telegram-login"
            sx={{
              minHeight: 48,
              display: 'grid',
              placeItems: 'center',
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              color: 'text.secondary',
            }}
          >
            Telegram Login Widget
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
