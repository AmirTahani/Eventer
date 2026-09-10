import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaymentReturnView, resolvePaymentIntentId } from '../payment-status';

const searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => searchParams.get(key),
  }),
}));

describe('PaymentReturnPage helpers', () => {
  beforeEach(() => {
    searchParams.delete('payment_intent');
    searchParams.delete('paymentIntent');
  });

  it('resolves payment_intent from query params used by the page', () => {
    searchParams.set('payment_intent', 'pi_from_query');
    expect(
      resolvePaymentIntentId((k) => searchParams.get(k)),
    ).toBe('pi_from_query');
  });

  it('renders return view from payment_intent query', () => {
    searchParams.set('payment_intent', 'pi_from_query');
    const intent = resolvePaymentIntentId((k) => searchParams.get(k));
    render(<PaymentReturnView paymentIntent={intent} />);
    expect(
      screen.getByText(/payment intent: pi_from_query/i),
    ).toBeInTheDocument();
  });
});
