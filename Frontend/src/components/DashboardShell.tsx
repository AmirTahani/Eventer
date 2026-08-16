'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import MenuIcon from '@mui/icons-material/Menu';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useState, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { ThemeModeSwitch } from '@/components/ThemeModeSwitch';

const drawerWidth = 260;

const nav = [
  { href: '/dashboard', label: 'Overview', match: 'exact' as const },
  { href: '/dashboard/events', label: 'Events' },
  { href: '/dashboard/djs', label: 'DJs' },
  { href: '/dashboard/locations', label: 'Locations' },
  { href: '/dashboard/invitations', label: 'Invitations' },
  { href: '/dashboard/tickets', label: 'My Tickets' },
  { href: '/dashboard/users', label: 'Users' },
  { href: '/dashboard/audit', label: 'Audit Logs' },
];

function isSelected(pathname: string, href: string, match?: 'exact') {
  if (match === 'exact') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, clearSession, ready } = useAuth();

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ px: 2.5 }}>
        <Typography variant="h6" color="primary.dark">
          Eventer
        </Typography>
      </Toolbar>
      <List sx={{ flex: 1, py: 1 }}>
        {nav.map((item) => (
          <ListItemButton
            key={item.href}
            component={Link}
            href={item.href}
            selected={isSelected(pathname, item.href, item.match)}
            onClick={() => setMobileOpen(false)}
          >
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}
            />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        {ready && user ? (
          <Box>
            <Typography variant="body2" fontWeight={600} noWrap>
              {user.firstName}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" noWrap>
              {user.roles.join(' · ') || 'Member'}
            </Typography>
            <Button
              size="small"
              sx={{ mt: 1 }}
              onClick={() => {
                clearSession();
                router.push('/login');
              }}
            >
              Sign out
            </Button>
          </Box>
        ) : (
          <Button component={Link} href="/login" fullWidth variant="outlined">
            Sign in
          </Button>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ gap: 1, minHeight: { xs: 56, sm: 64 } }}>
          {!isDesktop && (
            <IconButton
              edge="start"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="subtitle1"
            sx={{ flexGrow: 1, fontFamily: 'inherit', fontWeight: 600 }}
          >
            Organizer console
          </Typography>
          <ThemeModeSwitch />
          {!user && (
            <Button component={Link} href="/login" size="small" variant="contained">
              Sign in
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="Dashboard"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          maxWidth: '100%',
          px: { xs: 2, sm: 3, lg: 4 },
          py: { xs: 2, sm: 3 },
          overflowX: 'hidden',
        }}
      >
        <Toolbar />
        <Box sx={{ maxWidth: 1100, mx: 'auto', width: '100%' }}>{children}</Box>
      </Box>
    </Box>
  );
}
