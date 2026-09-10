'use client';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

/** Desktop page chrome. On phones the shell app bar already shows the title. */
export function PageHeader({ title, subtitle, action }: Props) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      justifyContent="space-between"
      alignItems={{ xs: 'stretch', sm: 'flex-start' }}
    >
      <Stack spacing={0.75} sx={{ display: { xs: subtitle ? 'flex' : 'none', md: 'flex' } }}>
        <Typography
          variant="h3"
          sx={{
            display: { xs: 'none', md: 'block' },
            fontSize: { md: '2.25rem' },
          }}
        >
          {title}
        </Typography>
        {subtitle ? (
          <Typography
            color="text.secondary"
            sx={{ maxWidth: 560, fontSize: { xs: '0.9rem', md: '1rem' } }}
          >
            {subtitle}
          </Typography>
        ) : null}
      </Stack>
      {action ? (
        <Stack
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignSelf: { sm: 'center' },
          }}
        >
          {action}
        </Stack>
      ) : null}
    </Stack>
  );
}
