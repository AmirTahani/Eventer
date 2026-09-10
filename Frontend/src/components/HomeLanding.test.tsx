import { describe, expect, it, beforeAll, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppProviders } from '@/app/providers';
import { HomeLanding } from '@/components/HomeLanding';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return {
    ...actual,
    fetchPublicConfig: vi.fn().mockResolvedValue({
      telegramBotUsername: 'FromApiBot',
    }),
  };
});

describe('HomeLanding', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }),
    });
  });

  it('introduces Eventer and links to host sign in', () => {
    render(
      <AppProviders>
        <HomeLanding botUsername="EventBot" />
      </AppProviders>,
    );

    expect(
      screen.getByRole('heading', {
        name: /the room stays closed until you open it/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: /hosts sign in/i })[0],
    ).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /open telegram/i })).toHaveAttribute(
      'href',
      'https://t.me/EventBot',
    );
  });

  it('hides the Telegram CTA when username is a placeholder', () => {
    render(
      <AppProviders>
        <HomeLanding botUsername="REPLACE_WITH_BOT_USERNAME" />
      </AppProviders>,
    );
    expect(
      screen.queryByRole('link', { name: /open telegram/i }),
    ).not.toBeInTheDocument();
  });

  it('shows how-it-works, audience, and FAQ', () => {
    render(
      <AppProviders>
        <HomeLanding botUsername="EventBot" />
      </AppProviders>,
    );
    expect(
      screen.getByRole('heading', { name: /invite, register, arrive/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Invite$/i })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /an unlisted link is not private/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /how do guests get in/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /privacy/i })).toHaveAttribute(
      'href',
      '/privacy',
    );
  });
});
