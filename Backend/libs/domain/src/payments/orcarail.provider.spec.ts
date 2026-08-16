import { createHmac } from 'node:crypto';
import {
  mapOrcaRailWebhook,
  OrcaRailPaymentProvider,
} from './orcarail.provider';

describe('mapOrcaRailWebhook', () => {
  it('maps payment_intent.completed to succeeded', () => {
    const payload = mapOrcaRailWebhook({
      type: 'payment_intent.completed',
      data: {
        object: {
          id: 'pi_abc',
          amount: '42.00',
          currency: 'usd',
          status: 'completed',
          metadata: { paymentId: 'pay-1', registrationId: 'reg-1' },
        },
      },
    });
    expect(payload).toEqual({
      transactionId: 'pi_abc',
      status: 'succeeded',
      amount: '42.00',
      currency: 'usd',
      metadata: { paymentId: 'pay-1' },
    });
  });

  it('maps payment_intent.succeeded alias to succeeded', () => {
    const payload = mapOrcaRailWebhook({
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_old',
          metadata: { paymentId: 'pay-2' },
        },
      },
    });
    expect(payload.status).toBe('succeeded');
    expect(payload.transactionId).toBe('pi_old');
  });

  it('maps payment_intent.processing', () => {
    const payload = mapOrcaRailWebhook({
      type: 'payment_intent.processing',
      data: { object: { id: 'pi_proc', status: 'processing' } },
    });
    expect(payload.status).toBe('processing');
  });

  it('maps payment_intent.canceled to failed', () => {
    const payload = mapOrcaRailWebhook({
      type: 'payment_intent.canceled',
      data: { object: { id: 'pi_cancel', status: 'canceled' } },
    });
    expect(payload.status).toBe('failed');
  });

  it('maps payment_intent.requires_payment_method to failed', () => {
    const payload = mapOrcaRailWebhook({
      type: 'payment_intent.requires_payment_method',
      data: {
        object: { id: 'pi_rpm', status: 'requires_payment_method' },
      },
    });
    expect(payload.status).toBe('failed');
  });
});

describe('OrcaRailPaymentProvider.verifyWebhookSignature', () => {
  it('accepts a valid HMAC with the configured secret', () => {
    const provider = new OrcaRailPaymentProvider({
      apiKey: 'ak_test',
      apiSecret: 'sk_test',
      baseUrl: 'https://api.orcarail.com/api/v1',
      tokenId: 'token-uuid',
      networkId: 'network-uuid',
      returnUrl: 'http://localhost:3001/payments/return',
    });
    const secret = 'whsec_test';
    const body = JSON.stringify({
      type: 'payment_intent.completed',
      data: { object: { id: 'pi_1' } },
    });
    const sig = createHmac('sha256', secret).update(body).digest('hex');
    expect(provider.verifyWebhookSignature(body, sig, secret)).toBe(true);
    expect(provider.verifyWebhookSignature(body, 'bad', secret)).toBe(false);
    expect(provider.verifyWebhookSignature(body, undefined, secret)).toBe(
      false,
    );
  });
});
