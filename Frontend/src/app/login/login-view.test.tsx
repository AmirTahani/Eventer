import { describe, expect, it, beforeAll, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AppProviders } from '@/app/providers';
import { LoginView } from './login-view';
import * as api from '@/lib/api';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace,
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

  it('completes login from Telegram redirect query params', async () => {
    window.history.replaceState(
      {},
      '',
      '/login?id=42&first_name=Amir&auth_date=1710000000&hash=abc',
    );
    const loginSpy = vi.spyOn(api, 'loginWithTelegram').mockResolvedValue({
      accessToken: 'jwt',
      user: {
        id: 'u1',
        telegramUserId: '42',
        firstName: 'Amir',
        status: 'APPROVED',
        roles: ['ADMIN'],
      },
    });

    render(
      <AppProviders>
        <LoginView botUsername="Eventer_advance_bot" />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 42,
          first_name: 'Amir',
          hash: 'abc',
        }),
      );
    });
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/dashboard');
    });

    loginSpy.mockRestore();
    window.history.replaceState({}, '', '/login');
  });

  it('shows an API error when Telegram login fails', async () => {
    window.history.replaceState(
      {},
      '',
      '/login?id=42&first_name=Amir&auth_date=1710000000&hash=bad',
    );
    vi.spyOn(api, 'loginWithTelegram').mockRejectedValue(
      new api.ApiError('Invalid Telegram login hash', 401, null),
    );

    render(
      <AppProviders>
        <LoginView botUsername="Eventer_advance_bot" />
      </AppProviders>,
    );

    expect(
      await screen.findByText(/invalid telegram login hash/i),
    ).toBeInTheDocument();
    window.history.replaceState({}, '', '/login');
  });
});
