'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useState } from 'react';
import { ApiError, createInvitation, type CreateInvitationResult } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function InvitationsPage() {
  const { accessToken, user, hasRole, ready } = useAuth();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreateInvitationResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    if (!accessToken) {
      setError('Sign in to create invitations.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setCopied(false);
    try {
      const result = await createInvitation(accessToken, {
        invitedTelegramUsername: username || undefined,
      });
      setCreated(result);
      setOpen(false);
      setUsername('');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError('Session expired or missing. Sign in again.');
        } else if (err.status === 403 || err.status === 409) {
          setError('Voucher or Admin role is required to create invitations.');
        } else {
          setError(err.message);
        }
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create invitation');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    if (!created?.deepLink) return;
    try {
      await navigator.clipboard.writeText(created.deepLink);
      setCopied(true);
    } catch {
      setError('Could not copy to clipboard — select the link manually.');
    }
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
      >
        <Box>
          <Typography variant="h3" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
            Invitations
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 520 }}>
            Create Telegram deep links for new guests. Share the link so they can
            join through the bot.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
          disabled={!ready}
          sx={{ alignSelf: { xs: 'stretch', sm: 'center' }, whiteSpace: 'nowrap' }}
        >
          New invitation
        </Button>
      </Stack>

      {!ready ? null : !accessToken ? (
        <Alert
          severity="warning"
          action={
            <Button component={Link} href="/login" color="inherit" size="small">
              Sign in
            </Button>
          }
        >
          You must sign in before creating invitations.
        </Alert>
      ) : user && !hasRole('VOUCHER', 'ADMIN') ? (
        <Alert severity="info">
          Your account needs the VOUCHER or Admin role to create invitations.
        </Alert>
      ) : null}

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {created && (
        <Box
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderRadius: 2,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle1" gutterBottom>
            Invitation ready
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Status: {created.status} · Token: {created.token}
          </Typography>
          <TextField
            label="Deep link"
            value={created.deepLink}
            InputProps={{ readOnly: true }}
            fullWidth
            multiline
            minRows={2}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={() => void copyLink()}>
              {copied ? 'Copied' : 'Copy link'}
            </Button>
            <Button
              component="a"
              href={created.deepLink}
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
            >
              Open in Telegram
            </Button>
          </Stack>
        </Box>
      )}

      {!created && accessToken && (
        <Typography variant="body2" color="text.secondary">
          Created invitations appear here after you generate a link. There is no
          list API yet — copy each link when it is created.
        </Typography>
      )}

      <Dialog
        open={open}
        onClose={() => !submitting && setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>New invitation</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Optionally bind the invite to a Telegram username. Leave blank for an
              open invite link.
            </Typography>
            <TextField
              label="Telegram username (optional)"
              placeholder="without @"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/^@/, ''))}
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleCreate()}
            disabled={submitting || !accessToken}
          >
            {submitting ? 'Creating…' : 'Create link'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
