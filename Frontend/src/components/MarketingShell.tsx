'use client';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ThemeModeSwitch } from '@/components/ThemeModeSwitch';
import { useAuth } from '@/lib/auth';

const footerLinks = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
] as const;

export function MarketingShell({ children }: { children: ReactNode }) {
  const { accessToken, ready } = useAuth();
  const pathname = usePathname();
  const signedIn = ready && Boolean(accessToken);
  const howItWorksHref = pathname === '/' ? '#how-it-works' : '/how-it-works';
  const faqHref = pathname === '/' ? '#faq' : '/faq';

  return (
    <Box
      sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: 'absolute',
          left: 16,
          top: 8,
          zIndex: 2000,
          px: 1.5,
          py: 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
          transform: 'translateY(-200%)',
          '&:focus': { transform: 'none' },
        }}
      >
        Skip to content
      </Box>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 1.5, minHeight: { xs: 64, sm: 72 } }}>
          <Typography
            variant="h6"
            component={Link}
            href="/"
            sx={{
              color: 'inherit',
              textDecoration: 'none',
              letterSpacing: '-0.02em',
            }}
          >
            Eventer
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button
            component={Link}
            href={howItWorksHref}
            color="inherit"
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            How it works
          </Button>
          <Button
            component={Link}
            href={faqHref}
            color="inherit"
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            FAQ
          </Button>
          <Button
            component={Link}
            href="/contact"
            color="inherit"
            sx={{ display: { xs: 'none', md: 'inline-flex' } }}
          >
            Contact
          </Button>
          <Button
            component={Link}
            href={signedIn ? '/dashboard' : '/login'}
            variant="contained"
            size="small"
          >
            {signedIn ? 'Dashboard' : 'Hosts sign in'}
          </Button>
          <ThemeModeSwitch />
        </Toolbar>
      </AppBar>
      {children}
      <Box
        component="footer"
        sx={{
          mt: 'auto',
          borderTop: 1,
          borderColor: 'divider',
          py: 3,
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Eventer · eventer.world
          </Typography>
          <Box
            component="nav"
            aria-label="Footer"
            sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1.5, sm: 2 } }}
          >
            {footerLinks.map((item) => (
              <Typography
                key={item.href}
                component={Link}
                href={item.href}
                variant="body2"
                color="text.secondary"
                sx={{ textDecoration: 'underline', textUnderlineOffset: 3 }}
              >
                {item.label}
              </Typography>
            ))}
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
