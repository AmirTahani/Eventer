import { createHmac } from 'node:crypto';
import {
  mapOrcaRailWebhook,
  OrcaRailPaymentProvider,
} from './orcarail.provider';

function buildProvider() {
  return new OrcaRailPaymentProvider({
    apiKey: 'ak_test',
    apiSecret: 'sk_test',
    baseUrl: 'https://api.orcarail.test/api/v1',
    tokenId: 'token-uuid',
    networkId: 'network-uuid',
    returnUrl: 'http://localhost:3001/payments/return',
    cancelUrl: 'http://localhost:3001/payments/cancel',
  });
}

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

  it('maps completed object status without type to succeeded', () => {
    const payload = mapOrcaRailWebhook({
      data: { object: { id: 'pi_status', status: 'completed' } },
    });
    expect(payload.status).toBe('succeeded');
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

  it('coerces numeric amounts and ignores non-string paymentId', () => {
    const payload = mapOrcaRailWebhook({
      type: 'payment_intent.completed',
      data: {
        object: {
          id: 'pi_num',
          amount: 10,
          currency: 'USD',
          metadata: { paymentId: 99 },
        },
      },
    });
    expect(payload.amount).toBe('10');
    expect(payload.metadata?.paymentId).toBeUndefined();
  });

  it('handles null/empty bodies safely', () => {
    expect(mapOrcaRailWebhook(null)).toEqual({
      transactionId: '',
      status: 'failed',
      amount: undefined,
      currency: undefined,
      metadata: { paymentId: undefined },
    });
    expect(mapOrcaRailWebhook(undefined).transactionId).toBe('');
  });

  it('parseWebhook delegates to mapOrcaRailWebhook', () => {
    const provider = buildProvider();
    const body = {
      type: 'payment_intent.processing',
      data: { object: { id: 'pi_x' } },
    };
    expect(provider.parseWebhook(body)).toEqual(mapOrcaRailWebhook(body));
  });
});

describe('OrcaRailPaymentProvider.verifyWebhookSignature', () => {
  it('accepts a valid HMAC with the configured secret', () => {
    const provider = buildProvider();
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

describe('OrcaRailPaymentProvider.createIntent', () => {
  it('creates, confirms, and returns pay_url checkout', async () => {
    const provider = buildProvider();
    const client = (
      provider as unknown as {
        client: {
          paymentIntents: {
            create: jest.Mock;
            confirm: jest.Mock;
          };
        };
      }
    ).client;

    client.paymentIntents.create = jest.fn().mockResolvedValue({
      id: 'pi_1',
      client_secret: 'cs_test',
    });
    client.paymentIntents.confirm = jest.fn().mockResolvedValue({
      id: 'pi_1',
      pay_url: 'https://pay.orcarail.test/pi_1',
    });

    const result = await provider.createIntent({
      paymentId: 'pay-1',
      amount: '25.00',
      currency: 'USD',
      registrationId: 'reg-1',
    });

    expect(client.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: '25.00',
        currency: 'usd',
        tokenId: 'token-uuid',
        networkId: 'network-uuid',
        return_url: 'http://localhost:3001/payments/return',
        cancel_url: 'http://localhost:3001/payments/cancel',
        metadata: { paymentId: 'pay-1', registrationId: 'reg-1' },
      }),
    );
    expect(client.paymentIntents.confirm).toHaveBeenCalledWith('pi_1', {
      client_secret: 'cs_test',
      return_url: 'http://localhost:3001/payments/return',
    });
    expect(result).toEqual({
      provider: 'orcarail',
      providerTransactionId: 'pi_1',
      checkoutUrl: 'https://pay.orcarail.test/pi_1',
    });
  });

  it('falls back to payment_link.link then nextAction URL', async () => {
    const provider = buildProvider();
    const client = (
      provider as unknown as {
        client: {
          paymentIntents: { create: jest.Mock; confirm: jest.Mock };
        };
      }
    ).client;

    client.paymentIntents.create = jest.fn().mockResolvedValue({
      id: 'pi_2',
      client_secret: 'cs_2',
    });
    client.paymentIntents.confirm = jest.fn().mockResolvedValue({
      id: 'pi_2',
      payment_link: { link: 'https://pay.orcarail.test/link' },
    });
    await expect(
      provider.createIntent({
        paymentId: 'p',
        amount: '1.00',
        currency: 'eur',
        registrationId: 'r',
      }),
    ).resolves.toMatchObject({
      checkoutUrl: 'https://pay.orcarail.test/link',
    });

    client.paymentIntents.confirm = jest.fn().mockResolvedValue({
      id: 'pi_3',
      nextAction: { redirectToUrl: { url: 'https://pay.orcarail.test/next' } },
    });
    await expect(
      provider.createIntent({
        paymentId: 'p',
        amount: '1.00',
        currency: 'eur',
        registrationId: 'r',
      }),
    ).resolves.toMatchObject({
      checkoutUrl: 'https://pay.orcarail.test/next',
    });
  });

  it('throws when client_secret or pay URL is missing', async () => {
    const provider = buildProvider();
    const client = (
      provider as unknown as {
        client: {
          paymentIntents: { create: jest.Mock; confirm: jest.Mock };
        };
      }
    ).client;

    client.paymentIntents.create = jest.fn().mockResolvedValue({
      id: 'pi_x',
    });
    await expect(
      provider.createIntent({
        paymentId: 'p',
        amount: '1.00',
        currency: 'usd',
        registrationId: 'r',
      }),
    ).rejects.toThrow(/client_secret/);

    client.paymentIntents.create = jest.fn().mockResolvedValue({
      id: 'pi_y',
      client_secret: 'cs',
    });
    client.paymentIntents.confirm = jest.fn().mockResolvedValue({
      id: 'pi_y',
    });
    await expect(
      provider.createIntent({
        paymentId: 'p',
        amount: '1.00',
        currency: 'usd',
        registrationId: 'r',
      }),
    ).rejects.toThrow(/hosted pay URL/);
  });
});
