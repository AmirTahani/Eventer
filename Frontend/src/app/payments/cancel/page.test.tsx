import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaymentCancelView, resolvePaymentIntentId } from '../payment-status';

const searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => searchParams.get(key),
  }),
}));

describe('PaymentCancelPage helpers', () => {
  beforeEach(() => {
    searchParams.delete('payment_intent');
    searchParams.delete('paymentIntent');
  });

  it('renders cancel view from payment_intent query', () => {
    searchParams.set('payment_intent', 'pi_cancel_q');
    const intent = resolvePaymentIntentId((k) => searchParams.get(k));
    render(<PaymentCancelView paymentIntent={intent} />);
    expect(
      screen.getByText(/canceled intent: pi_cancel_q/i),
    ).toBeInTheDocument();
  });

  it('renders generic cancel copy without query', () => {
    render(<PaymentCancelView paymentIntent={null} />);
    expect(
      screen.getByText(/payment was not completed/i),
    ).toBeInTheDocument();
  });
});
