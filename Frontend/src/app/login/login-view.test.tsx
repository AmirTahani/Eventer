import { describe, expect, it, beforeAll, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppProviders } from '@/app/providers';
import { LoginView } from './login-view';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('LoginView', () => {
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

  it('offers Telegram login and no access-token paste field', () => {
    render(
      <AppProviders>
        <LoginView botUsername="Eventer_advance_bot" />
      </AppProviders>,
    );

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(
      screen.getByText(/use telegram login with the account that was invited/i),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/access token/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /use access token/i }),
    ).not.toBeInTheDocument();
  });
});
