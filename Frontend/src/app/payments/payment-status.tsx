'use client';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export function resolvePaymentIntentId(
  get: (key: string) => string | null,
): string | null {
  return get('payment_intent') ?? get('paymentIntent') ?? null;
}

export function PaymentReturnView({
  paymentIntent,
}: {
  paymentIntent: string | null;
}) {
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

export function PaymentCancelView({
  paymentIntent,
}: {
  paymentIntent: string | null;
}) {
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
