'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { RequireHostAuth, ADMIN_CONSOLE_ROLES } from '@/components/RequireHostAuth';
import { ThemeModeSwitch } from '@/components/ThemeModeSwitch';
import { useAuth } from '@/lib/auth';

const drawerWidth = 240;

const nav = [
  { href: '/admin', label: 'Overview', exact: true },
  { href: '/admin/events', label: 'Events' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/payments', label: 'Payments' },
  { href: '/admin/registrations', label: 'Registrations' },
  { href: '/admin/tickets', label: 'Tickets' },
  { href: '/admin/audit', label: 'Audit' },
] as const;

function selected(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearSession } = useAuth();

  if (pathname === '/admin/login') {
    return children;
  }

  return (
    <RequireHostAuth roles={ADMIN_CONSOLE_ROLES} loginHref="/admin/login" label="admin">
      <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            zIndex: (t) => t.zIndex.drawer + 1,
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
          }}
        >
          <Toolbar sx={{ gap: 1 }}>
            <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 650 }}>
              Admin
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user?.firstName}
            </Typography>
            <ThemeModeSwitch />
            <Button
              size="small"
              onClick={() => {
                clearSession();
                router.replace('/admin/login');
              }}
            >
              Sign out
            </Button>
          </Toolbar>
        </AppBar>

        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          <Toolbar>
            <Typography variant="h6" color="primary">
              Eventer Admin
            </Typography>
          </Toolbar>
          <List>
            {nav.map((item) => (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href}
                selected={selected(pathname, item.href, 'exact' in item && item.exact)}
              >
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}
                />
              </ListItemButton>
            ))}
          </List>
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
            px: { xs: 2, sm: 3 },
            py: 2,
            pb: { xs: 10, md: 3 },
          }}
        >
          <Toolbar />
          <Box sx={{ maxWidth: 1200, mx: 'auto' }}>{children}</Box>
        </Box>

        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            gap: 0.5,
            px: 1,
            py: 1,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            overflowX: 'auto',
            zIndex: (t) => t.zIndex.appBar,
          }}
        >
          {nav.map((item) => (
            <Button
              key={item.href}
              component={Link}
              href={item.href}
              size="small"
              variant={
                selected(pathname, item.href, 'exact' in item && item.exact)
                  ? 'contained'
                  : 'text'
              }
              sx={{ flexShrink: 0 }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Box>
    </RequireHostAuth>
  );
}
