'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState, type FormEvent } from 'react';
import {
  normalizeTelegramBotUsername,
  telegramBotUrl,
} from '@/lib/telegram';

export function ContactForm({
  contactEmail,
  botUsername,
}: {
  contactEmail: string;
  botUsername?: string | null;
}) {
  const bot =
    normalizeTelegramBotUsername(botUsername) ??
    normalizeTelegramBotUsername(
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME,
    );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();
    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setError('Please fill in your name, email, and message.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Enter a valid email so we can reply.');
      return;
    }

    const subject = encodeURIComponent(`Eventer contact — ${trimmedName}`);
    const body = encodeURIComponent(
      `Name: ${trimmedName}\nEmail: ${trimmedEmail}\n\n${trimmedMessage}`,
    );
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <Stack spacing={4} sx={{ mt: 1 }}>
      {bot ? (
        <Box
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderRadius: 2,
            bgcolor: 'action.hover',
            border: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="h2" sx={{ fontSize: '1.25rem', mb: 1 }}>
            Fastest: Telegram
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2, maxWidth: 520 }}>
            Message the Eventer bot. Same place guests already use for invites
            and tickets.
          </Typography>
          <Button
            component="a"
            href={telegramBotUrl(bot)}
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
          >
            Open @{bot}
          </Button>
        </Box>
      ) : null}

      <Box component="form" onSubmit={onSubmit} noValidate>
        <Typography variant="h2" sx={{ fontSize: '1.25rem', mb: 1 }}>
          Or send a message
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2.5, maxWidth: 520 }}>
          We read every note. Your email app opens with a draft to{' '}
          {contactEmail}.
        </Typography>
        <Stack spacing={2}>
          {error ? (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          ) : null}
          {sent ? (
            <Alert severity="success">
              If your email app did not open, write us at {contactEmail}
              {bot ? ` or message @${bot} on Telegram.` : '.'}
            </Alert>
          ) : null}
          <TextField
            label="Name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Message"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            fullWidth
            multiline
            minRows={4}
          />
          <Button type="submit" variant="contained" sx={{ alignSelf: 'flex-start' }}>
            Send message
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}
