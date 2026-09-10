'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { MarketingShell } from '@/components/MarketingShell';

export function MarketingPage({
  title,
  lede,
  sections,
  numbered,
  closing,
  children,
}: {
  title: string;
  lede: string;
  sections?: ReadonlyArray<{ title: string; body: string }>;
  numbered?: boolean;
  closing?: string;
  children?: ReactNode;
}) {
  return (
    <MarketingShell>
      <Box component="main" id="main-content" tabIndex={-1}>
        <Container maxWidth="md" sx={{ py: { xs: 6, sm: 10 } }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2rem', sm: '2.75rem' },
              lineHeight: 1.15,
              mb: 2,
            }}
          >
            {title}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontSize: { xs: '1.05rem', sm: '1.15rem' }, mb: 5, maxWidth: 640 }}
          >
            {lede}
          </Typography>
          {sections ? (
            <Stack
              spacing={4}
              component={numbered ? 'ol' : 'div'}
              sx={{ m: 0, listStyle: numbered ? 'none' : undefined, p: 0 }}
            >
              {sections.map((section, index) => (
                <Box component={numbered ? 'li' : 'section'} key={section.title}>
                  {numbered ? (
                    <Typography color="primary" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {index + 1}
                    </Typography>
                  ) : null}
                  <Typography
                    variant="h2"
                    sx={{ fontSize: numbered ? '1.5rem' : '1.35rem', mb: 1 }}
                  >
                    {section.title}
                  </Typography>
                  <Typography color="text.secondary">{section.body}</Typography>
                </Box>
              ))}
            </Stack>
          ) : null}
          {closing ? (
            <Typography color="text.secondary" sx={{ mt: sections ? 4 : 0 }}>
              {closing}
            </Typography>
          ) : null}
          {children}
        </Container>
      </Box>
    </MarketingShell>
  );
}
