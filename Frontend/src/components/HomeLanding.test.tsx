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

  it('shows editorial hero and organize CTA', () => {
    render(
      <AppProviders>
        <HomeLanding botUsername="EventBot" />
      </AppProviders>,
    );

    expect(
      screen.getByRole('heading', {
        name: /stay closed until you open the door/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: /organize an event/i })[0],
    ).toHaveAttribute('href', '/login');
  });

  it('shows guest join CTA when bot username is set', () => {
    render(
      <AppProviders>
        <HomeLanding botUsername="EventBot" />
      </AppProviders>,
    );
    expect(screen.getByRole('link', { name: /join an event/i })).toHaveAttribute(
      'href',
      'https://t.me/EventBot',
    );
  });

  it('hides guest join CTA when username is a placeholder', () => {
    render(
      <AppProviders>
        <HomeLanding botUsername="REPLACE_WITH_BOT_USERNAME" />
      </AppProviders>,
    );
    expect(
      screen.queryByRole('link', { name: /join an event/i }),
    ).not.toBeInTheDocument();
  });

  it('shows guest, organizer, how-it-works, and FAQ sections', () => {
    render(
      <AppProviders>
        <HomeLanding botUsername="EventBot" />
      </AppProviders>,
    );
    expect(
      screen.getByRole('heading', { name: /you're invited in telegram/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /you run the door from the web/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /invite, register, arrive/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /content stays closed/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /an unlisted link is not private/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /how do guests get in/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /how is content secured/i }),
    ).toBeInTheDocument();
  });
});
