import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => searchParams.get(key),
  }),
}));

describe('PaymentCancelPage', () => {
  beforeEach(() => {
    searchParams.delete('payment_intent');
    searchParams.delete('paymentIntent');
  });

  it('renders cancel view from payment_intent query', async () => {
    searchParams.set('payment_intent', 'pi_cancel_q');
    const { default: PaymentCancelPage } = await import('./page');
    render(<PaymentCancelPage />);
    expect(
      await screen.findByText(/canceled intent: pi_cancel_q/i),
    ).toBeInTheDocument();
  });

  it('renders generic cancel copy without query', async () => {
    const { default: PaymentCancelPage } = await import('./page');
    render(<PaymentCancelPage />);
    expect(
      await screen.findByText(/payment was not completed/i),
    ).toBeInTheDocument();
  });
});
