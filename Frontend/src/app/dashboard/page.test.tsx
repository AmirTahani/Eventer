import { describe, expect, it, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AppProviders } from '@/app/providers';
import DashboardHomePage from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/dashboard',
}));

describe('DashboardHomePage', () => {
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

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows signed-out overview cards', async () => {
    render(
      <AppProviders>
        <DashboardHomePage />
      </AppProviders>,
    );

    expect(
      await screen.findByRole('heading', { name: /overview/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /create and publish private events/i }),
    ).toHaveAttribute('href', '/dashboard/events');
    expect(
      screen.getByRole('link', { name: /issue telegram deep links/i }),
    ).toHaveAttribute('href', '/dashboard/invitations');
  });

  it('greets an authenticated user', async () => {
    window.localStorage.setItem('eventer.accessToken', 'jwt');
    window.localStorage.setItem(
      'eventer.user',
      JSON.stringify({
        id: 'u1',
        telegramUserId: '1',
        firstName: 'Sara',
        status: 'APPROVED',
        roles: ['ORGANIZER'],
      }),
    );

    render(
      <AppProviders>
        <DashboardHomePage />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Sara/).length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/Welcome back, Sara/i)).toBeInTheDocument();
  });
});
