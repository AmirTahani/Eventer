import { describe, expect, it, beforeAll, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppProviders } from '@/app/providers';
import { HomeLanding } from '@/components/HomeLanding';

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

  it('introduces Eventer and links to organizer sign in', () => {
    render(
      <AppProviders>
        <HomeLanding botUsername="EventBot" />
      </AppProviders>,
    );

    expect(
      screen.getByRole('heading', {
        name: /private events, from invite to the door/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /organizer sign in/i }),
    ).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /telegram bot/i })).toHaveAttribute(
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
      screen.queryByRole('link', { name: /telegram bot/i }),
    ).not.toBeInTheDocument();
  });

  it('shows how-it-works and platform sections', () => {
    render(
      <AppProviders>
        <HomeLanding botUsername="EventBot" />
      </AppProviders>,
    );
    expect(
      screen.getByRole('heading', { name: /three steps/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Invite$/i })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /nothing visible by default/i }),
    ).toBeInTheDocument();
  });
});
