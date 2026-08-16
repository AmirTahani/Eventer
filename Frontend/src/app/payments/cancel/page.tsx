'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import {
  PaymentCancelView,
  resolvePaymentIntentId,
} from '../payment-status';

function CancelContent() {
  const params = useSearchParams();
  return (
    <PaymentCancelView
      paymentIntent={resolvePaymentIntentId((k) => params.get(k))}
    />
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
        py: 4,
      }}
    >
      <Paper sx={{ p: { xs: 3, sm: 4 }, maxWidth: 480, width: '100%' }}>
        <Suspense fallback={<Typography>Loading…</Typography>}>
          <CancelContent />
        </Suspense>
      </Paper>
    </Box>
  );
}
