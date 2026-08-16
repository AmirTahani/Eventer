'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import type { ReactNode } from 'react';

const width = 240;

const nav = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/events', label: 'Events' },
  { href: '/dashboard/djs', label: 'DJs' },
  { href: '/dashboard/locations', label: 'Locations' },
  { href: '/dashboard/invitations', label: 'Invitations' },
  { href: '/dashboard/tickets', label: 'My Tickets' },
  { href: '/dashboard/users', label: 'Users' },
  { href: '/dashboard/audit', label: 'Audit Logs' },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (t) => t.zIndex.drawer + 1, boxShadow: 'none' }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif' }}>
            Eventer
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width,
          [`& .MuiDrawer-paper`]: {
            width,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          },
        }}
      >
        <Toolbar />
        <List>
          {nav.map((item) => (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
