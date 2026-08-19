'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import PolicyOutlinedIcon from '@mui/icons-material/PolicyOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import HeadphonesOutlinedIcon from '@mui/icons-material/HeadphonesOutlined';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useState, type ReactNode } from 'react';
import type { SvgIconComponent } from '@mui/icons-material';
import { useAuth } from '@/lib/auth';
import { ThemeModeSwitch } from '@/components/ThemeModeSwitch';
import { useColorMode } from '@/theme/color-mode';
import {
  allNav,
  isNavSelected,
  moreNav,
  parentPath,
  primaryTabs,
  screenTitle,
} from '@/nav/dashboard-nav';

const drawerWidth = 260;

const tabIcons: Record<string, SvgIconComponent> = {
  '/dashboard': HomeOutlinedIcon,
  '/dashboard/events': EventOutlinedIcon,
  '/dashboard/tickets': ConfirmationNumberOutlinedIcon,
  '/dashboard/invitations': MailOutlinedIcon,
};

const moreIcons: Record<string, SvgIconComponent> = {
  '/dashboard/djs': HeadphonesOutlinedIcon,
  '/dashboard/locations': PlaceOutlinedIcon,
  '/dashboard/users': PeopleOutlinedIcon,
  '/dashboard/audit': PolicyOutlinedIcon,
};

function DrawerNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const { user, clearSession, ready } = useAuth();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ px: 2.5 }}>
        <Typography variant="h6" color="primary">
          Eventer
        </Typography>
      </Toolbar>
      <List sx={{ flex: 1, py: 1 }}>
        {allNav.map((item) => (
          <ListItemButton
            key={item.href}
            component={Link}
            href={item.href}
            selected={isNavSelected(pathname, item.href, item.match)}
            onClick={onNavigate}
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
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              noWrap
            >
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
}

function MoreSheet({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  const router = useRouter();
  const { user, clearSession, ready } = useAuth();
  const { mode, toggleMode } = useColorMode();

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => undefined}
      disableSwipeToOpen
      PaperProps={{
        sx: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          pb: 'env(safe-area-inset-bottom, 0px)',
          maxHeight: '80vh',
        },
      }}
    >
      <Box sx={{ px: 2, pt: 1.25, pb: 0.5, display: 'flex', justifyContent: 'center' }}>
        <Box
          sx={{
            width: 36,
            height: 4,
            borderRadius: 99,
            bgcolor: 'divider',
          }}
        />
      </Box>
      <Typography variant="subtitle2" sx={{ px: 2.5, py: 1 }} color="text.secondary">
        More
      </Typography>
      <List sx={{ pt: 0 }}>
        {moreNav.map((item) => {
          const Icon = moreIcons[item.href];
          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={isNavSelected(pathname, item.href)}
              onClick={onClose}
              sx={{ mx: 1, borderRadius: 2 }}
            >
              {Icon ? (
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
              ) : null}
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
      <Divider sx={{ my: 0.5 }} />
      <List>
        <ListItemButton onClick={toggleMode} sx={{ mx: 1, borderRadius: 2 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            {mode === 'dark' ? (
              <LightModeOutlinedIcon fontSize="small" />
            ) : (
              <DarkModeOutlinedIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText
            primary={mode === 'dark' ? 'Light mode' : 'Dark mode'}
          />
        </ListItemButton>
        {ready && user ? (
          <ListItemButton
            sx={{ mx: 1, borderRadius: 2 }}
            onClick={() => {
              clearSession();
              onClose();
              router.push('/login');
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <LogoutOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={`Sign out · ${user.firstName}`} />
          </ListItemButton>
        ) : (
          <ListItemButton
            component={Link}
            href="/login"
            onClick={onClose}
            sx={{ mx: 1, borderRadius: 2 }}
          >
            <ListItemText primary="Sign in" />
          </ListItemButton>
        )}
      </List>
    </SwipeableDrawer>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const backTo = parentPath(pathname);
  const title = screenTitle(pathname);
  const moreSelected = moreNav.some((item) =>
    isNavSelected(pathname, item.href),
  );

  const tabValue =
    primaryTabs.find((tab) => isNavSelected(pathname, tab.href, tab.match))
      ?.href ?? (moreSelected ? '__more__' : false);

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100dvh',
        bgcolor: 'background.default',
      }}
    >
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar
          sx={{
            gap: 0.5,
            minHeight: { xs: 52, sm: 64 },
            px: { xs: 1, sm: 2 },
            pt: { xs: 'env(safe-area-inset-top, 0px)', md: 0 },
          }}
        >
          {backTo ? (
            <IconButton
              edge="start"
              aria-label="Back"
              onClick={() => router.push(backTo)}
              sx={{ display: { md: 'none' } }}
            >
              <ArrowBackIcon />
            </IconButton>
          ) : null}
          <Typography
            variant="subtitle1"
            noWrap
            sx={{
              flexGrow: 1,
              fontWeight: 650,
              fontSize: { xs: '1.05rem', sm: '1.1rem' },
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </Typography>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <ThemeModeSwitch />
          </Box>
          {!user && (
            <Button
              component={Link}
              href="/login"
              size="small"
              variant="contained"
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
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
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          <DrawerNav pathname={pathname} />
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          maxWidth: '100%',
          px: { xs: 2, sm: 3, lg: 4 },
          pt: { xs: 1.5, sm: 3 },
          pb: {
            xs: 'calc(80px + env(safe-area-inset-bottom, 0px))',
            md: 3,
          },
          overflowX: 'hidden',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 52, sm: 64 } }} />
        <Box sx={{ maxWidth: 1100, mx: 'auto', width: '100%' }}>{children}</Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: (t) => t.zIndex.appBar,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          pb: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <BottomNavigation
          showLabels
          value={tabValue}
          onChange={(_e, value: string) => {
            if (value === '__more__') {
              setMoreOpen(true);
              return;
            }
            router.push(value);
          }}
          sx={{
            height: 60,
            bgcolor: 'transparent',
            '& .MuiBottomNavigationAction-root': {
              minWidth: 0,
              px: 0.5,
              color: 'text.secondary',
              '&.Mui-selected': { color: 'primary.main' },
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.68rem',
              fontWeight: 600,
              '&.Mui-selected': { fontSize: '0.68rem' },
            },
          }}
        >
          {primaryTabs.map((tab) => {
            const Icon = tabIcons[tab.href];
            return (
              <BottomNavigationAction
                key={tab.href}
                value={tab.href}
                label={tab.label}
                icon={Icon ? <Icon /> : undefined}
              />
            );
          })}
          <BottomNavigationAction
            value="__more__"
            label="More"
            icon={<MoreHorizIcon />}
          />
        </BottomNavigation>
      </Paper>

      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        pathname={pathname}
      />
    </Box>
  );
}
