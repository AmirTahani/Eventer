'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

function ReturnContent() {
  const params = useSearchParams();
  const paymentIntent =
    params.get('payment_intent') ?? params.get('paymentIntent') ?? null;

  return (
    <Stack spacing={2}>
      <Typography
        variant="h4"
        sx={{ fontFamily: '"Playfair Display", serif' }}
      >
        Payment received
      </Typography>
      <Typography color="text.secondary">
        Thanks — we are confirming your payment on-chain. Your tickets will
        appear once the webhook settles (usually within a minute).
      </Typography>
      {paymentIntent ? (
        <Alert severity="info">Payment intent: {paymentIntent}</Alert>
      ) : (
        <Alert severity="success">
          You can close this page and return to Telegram or the dashboard.
        </Alert>
      )}
    </Stack>
  );
}

export default function PaymentReturnPage() {
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
      <Paper sx={{ p: 4, maxWidth: 480, width: '100%' }}>
        <Suspense fallback={<Typography>Loading…</Typography>}>
          <ReturnContent />
        </Suspense>
      </Paper>
    </Box>
  );
}
