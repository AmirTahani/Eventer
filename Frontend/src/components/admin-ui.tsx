'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export function AdminDataPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '1.85rem' } }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {children}
    </Stack>
  );
}

export function useAdminResource<T>(
  loader: (accessToken: string) => Promise<T>,
  deps: unknown[] = [],
) {
  const { accessToken } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void loader(accessToken)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Failed to load',
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls deps
  }, [accessToken, ...deps]);

  return { data, error, loading, setData };
}

export function AdminLoadingState({
  loading,
  error,
  empty,
  children,
}: {
  loading: boolean;
  error: string | null;
  empty?: boolean;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <Box sx={{ py: 6, display: 'grid', placeItems: 'center' }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  if (empty) {
    return <Alert severity="info">No rows yet.</Alert>;
  }
  return children;
}

export function AdminFilterBar({
  q,
  onQ,
  status,
  onStatus,
  statusOptions,
  onRefresh,
}: {
  q: string;
  onQ: (value: string) => void;
  status: string;
  onStatus: (value: string) => void;
  statusOptions: Array<{ value: string; label: string }>;
  onRefresh: () => void;
}) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <TextField
        size="small"
        label="Search"
        value={q}
        onChange={(e) => onQ(e.target.value)}
        fullWidth
      />
      <TextField
        size="small"
        label="Status"
        select
        SelectProps={{ native: true }}
        value={status}
        onChange={(e) => onStatus(e.target.value)}
        sx={{ minWidth: 160 }}
      >
        <option value="">All</option>
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </TextField>
      <Button variant="outlined" onClick={onRefresh} sx={{ flexShrink: 0 }}>
        Refresh
      </Button>
    </Stack>
  );
}

export function AdminTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<{ key: string; href?: string; cells: ReactNode[] }>;
}) {
  return (
    <Paper sx={{ overflowX: 'auto' }}>
      <Box
        component="table"
        sx={{
          width: '100%',
          borderCollapse: 'collapse',
          '& th, & td': {
            textAlign: 'left',
            px: 1.5,
            py: 1.25,
            borderBottom: 1,
            borderColor: 'divider',
            fontSize: 14,
            whiteSpace: 'nowrap',
          },
          '& th': { color: 'text.secondary', fontWeight: 600 },
        }}
      >
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              {row.cells.map((cell, i) => (
                <td key={`${row.key}-${i}`}>
                  {i === 0 && row.href ? (
                    <Typography
                      component={Link}
                      href={row.href}
                      color="primary"
                      sx={{ textDecoration: 'underline', textUnderlineOffset: 2 }}
                    >
                      {cell}
                    </Typography>
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Box>
    </Paper>
  );
}
