'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

function CancelContent() {
  const params = useSearchParams();
  const paymentIntent =
    params.get('payment_intent') ?? params.get('paymentIntent') ?? null;

  return (
    <Stack spacing={2}>
      <Typography
        variant="h4"
        sx={{ fontFamily: '"Playfair Display", serif' }}
      >
        Payment canceled
      </Typography>
      <Typography color="text.secondary">
        No charge was completed. You can reopen the pay link from Telegram or
        create a new payment intent from the dashboard while your registration
        is still awaiting payment.
      </Typography>
      {paymentIntent ? (
        <Alert severity="warning">Canceled intent: {paymentIntent}</Alert>
      ) : (
        <Alert severity="warning">Payment was not completed.</Alert>
      )}
    </Stack>
  );
}

export default function PaymentCancelPage() {
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
          <CancelContent />
        </Suspense>
      </Paper>
    </Box>
  );
}
