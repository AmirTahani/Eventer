import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => searchParams.get(key),
  }),
}));

describe('PaymentReturnPage', () => {
  beforeEach(() => {
    searchParams.delete('payment_intent');
    searchParams.delete('paymentIntent');
  });

  it('renders return view from payment_intent query', async () => {
    searchParams.set('payment_intent', 'pi_from_query');
    const { default: PaymentReturnPage } = await import('./page');
    render(<PaymentReturnPage />);
    expect(
      await screen.findByText(/payment intent: pi_from_query/i),
    ).toBeInTheDocument();
  });
});
