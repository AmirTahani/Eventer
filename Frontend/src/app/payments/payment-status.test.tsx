import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  PaymentCancelView,
  PaymentReturnView,
  resolvePaymentIntentId,
} from './payment-status';

describe('resolvePaymentIntentId', () => {
  it('prefers payment_intent over paymentIntent', () => {
    const get = (key: string) =>
      ({ payment_intent: 'pi_a', paymentIntent: 'pi_b' })[key] ?? null;
    expect(resolvePaymentIntentId(get)).toBe('pi_a');
  });

  it('falls back to paymentIntent camelCase', () => {
    const get = (key: string) =>
      ({ paymentIntent: 'pi_camel' })[key] ?? null;
    expect(resolvePaymentIntentId(get)).toBe('pi_camel');
  });

  it('returns null when neither query is present', () => {
    expect(resolvePaymentIntentId(() => null)).toBeNull();
  });
});

describe('PaymentReturnView', () => {
  it('shows processing copy and intent id when present', () => {
    render(<PaymentReturnView paymentIntent="pi_return_1" />);
    expect(
      screen.getByRole('heading', { name: /payment received/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/confirming your payment on-chain/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/payment intent: pi_return_1/i)).toBeInTheDocument();
  });

  it('shows generic success alert when intent id is missing', () => {
    render(<PaymentReturnView paymentIntent={null} />);
    expect(
      screen.getByText(/close this page and return to telegram/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/payment intent:/i)).not.toBeInTheDocument();
  });
});

describe('PaymentCancelView', () => {
  it('shows canceled intent id when present', () => {
    render(<PaymentCancelView paymentIntent="pi_cancel_1" />);
    expect(
      screen.getByRole('heading', { name: /payment canceled/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/canceled intent: pi_cancel_1/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/no charge was completed/i)).toBeInTheDocument();
  });

  it('shows generic cancel alert without intent id', () => {
    render(<PaymentCancelView paymentIntent={null} />);
    expect(
      screen.getByText(/payment was not completed/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/canceled intent:/i)).not.toBeInTheDocument();
  });
});
