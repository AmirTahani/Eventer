import { describe, expect, it, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppProviders } from '@/app/providers';
import { HomeLanding } from '@/components/HomeLanding';

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
      screen.getByRole('heading', { name: /private events, from invite to the door/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /organizer sign in/i })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.getByRole('link', { name: /telegram bot/i })).toHaveAttribute(
      'href',
      'https://t.me/EventBot',
    );
  });
});
