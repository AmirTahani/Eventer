'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import {
  PaymentReturnView,
  resolvePaymentIntentId,
} from '../payment-status';

function ReturnContent() {
  const params = useSearchParams();
  return (
    <PaymentReturnView paymentIntent={resolvePaymentIntentId((k) => params.get(k))} />
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
