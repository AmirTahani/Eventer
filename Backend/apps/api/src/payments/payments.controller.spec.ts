import { PaymentsController } from './payments.controller';
import type { PaymentsService } from '@eventer/domain';

describe('PaymentsController', () => {
  const payments = {
    createIntent: jest.fn().mockResolvedValue({ checkoutUrl: 'https://pay' }),
    handleWebhook: jest.fn().mockResolvedValue({ received: true }),
  };

  const controller = new PaymentsController(
    payments as unknown as PaymentsService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates createIntent to the service', async () => {
    const user = { id: 'u-1' } as never;
    await controller.createIntent(user, { registrationId: 'reg-1' });
    expect(payments.createIntent).toHaveBeenCalledWith(user, 'reg-1');
  });

  it('prefers x-webhook-signature over x-provider-signature', async () => {
    const body = { type: 'payment_intent.completed' };
    const req = {
      rawBody: Buffer.from(JSON.stringify(body)),
    } as never;

    await controller.handleWebhook(
      'orcarail',
      'orca-sig',
      'mock-sig',
      body,
      req,
    );

    expect(payments.handleWebhook).toHaveBeenCalledWith(
      'orcarail',
      JSON.stringify(body),
      'orca-sig',
      body,
    );
  });

  it('falls back to x-provider-signature and stringifies body without rawBody', async () => {
    const body = { transactionId: 't1', status: 'succeeded' };
    await controller.handleWebhook(
      'mock',
      undefined,
      'mock-sig',
      body,
      {} as never,
    );

    expect(payments.handleWebhook).toHaveBeenCalledWith(
      'mock',
      JSON.stringify(body),
      'mock-sig',
      body,
    );
  });

  it('uses string rawBody when provided', async () => {
    const body = { ok: true };
    await controller.handleWebhook('mock', undefined, 'sig', body, {
      rawBody: '{"ok":true}',
    } as never);

    expect(payments.handleWebhook).toHaveBeenCalledWith(
      'mock',
      '{"ok":true}',
      'sig',
      body,
    );
  });
});
