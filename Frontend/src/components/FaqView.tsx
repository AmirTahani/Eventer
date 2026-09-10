'use client';

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { MarketingFaqAccordion } from '@/components/MarketingFaqAccordion';
import { MarketingShell } from '@/components/MarketingShell';
import { faqs } from '@/lib/marketing-content';

export function FaqView() {
  return (
    <MarketingShell>
      <Container
        component="main"
        id="main-content"
        maxWidth="md"
        tabIndex={-1}
        sx={{ py: { xs: 6, sm: 10 } }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '2rem', sm: '2.75rem' },
            lineHeight: 1.15,
            mb: 2,
          }}
        >
          Questions
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ fontSize: { xs: '1.05rem', sm: '1.15rem' }, mb: 5, maxWidth: 640 }}
        >
          Short answers for hosts and invited guests. Eventer has no public
          directory.
        </Typography>
        <MarketingFaqAccordion items={faqs} />
      </Container>
    </MarketingShell>
  );
}
