import { createHmac } from 'node:crypto';
import { PaymentStatus, RegistrationStatus } from '@prisma/client';
import { MockPaymentProvider } from './payment-provider';
import { PaymentsService } from './payments.service';

describe('MockPaymentProvider signature', () => {
  const provider = new MockPaymentProvider();
  const secret = 'dev-payment-webhook-secret';

  it('accepts a valid HMAC signature', () => {
    const body = JSON.stringify({ transactionId: 't1', status: 'succeeded' });
    const sig = createHmac('sha256', secret).update(body).digest('hex');
    expect(provider.verifyWebhookSignature(body, sig, secret)).toBe(true);
    expect(provider.verifyWebhookSignature(body, `sha256=${sig}`, secret)).toBe(
      true,
    );
  });

  it('rejects invalid signatures', () => {
    expect(
      provider.verifyWebhookSignature('{}', 'deadbeef', secret),
    ).toBe(false);
    expect(provider.verifyWebhookSignature('{}', undefined, secret)).toBe(
      false,
    );
  });
});

describe('PaymentsService webhook idempotency', () => {
  function build(prisma: Record<string, unknown>) {
    return new PaymentsService(
      prisma as never,
      { get: jest.fn().mockReturnValue('dev-payment-webhook-secret') } as never,
      { issueForRegistration: jest.fn().mockResolvedValue([]) } as never,
      { enqueue: jest.fn().mockResolvedValue(null) } as never,
      { onCapacityFreed: jest.fn().mockResolvedValue(undefined) } as never,
    );
  }

  it('acks duplicate succeeded webhooks without re-confirming', async () => {
    const existing = {
      id: 'pay-1',
      status: PaymentStatus.SUCCEEDED,
      registrationId: 'reg-1',
      providerTransactionId: 'txn_abc',
    };
    const confirmSpy = jest.fn();
    const service = build({
      payment: {
        findFirst: jest.fn().mockResolvedValue(existing),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    });
    (
      service as unknown as { confirmPayment: typeof confirmSpy }
    ).confirmPayment = confirmSpy;

    const body = JSON.stringify({
      transactionId: 'txn_abc',
      status: 'succeeded',
      metadata: { paymentId: 'pay-1' },
    });
    const sig = createHmac('sha256', 'dev-payment-webhook-secret')
      .update(body)
      .digest('hex');

    const result = await service.handleWebhook(
      'mock',
      body,
      sig,
      JSON.parse(body),
    );
    expect(result).toEqual({ received: true });
    expect(confirmSpy).not.toHaveBeenCalled();
  });
});

describe('PaymentsService.expireRegistration', () => {
  it('releases capacity when payment window expires', async () => {
    const reservationUpdate = jest.fn().mockResolvedValue({});
    const regUpdate = jest.fn().mockResolvedValue({});
    const paymentUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    const eventUpdate = jest.fn().mockResolvedValue({});

    const reg = {
      id: 'reg-1',
      eventId: 'evt-1',
      primaryUserId: 'u-1',
      status: RegistrationStatus.PENDING_PAYMENT,
      expiresAt: new Date(Date.now() - 1000),
      capacityReservation: {
        id: 'cap-1',
        status: 'ACTIVE',
      },
      event: { id: 'evt-1', capacity: 10, status: 'FULL' },
    };

    const tx = {
      eventRegistration: {
        findUnique: jest.fn().mockResolvedValue(reg),
        update: regUpdate,
      },
      capacityReservation: {
        update: reservationUpdate,
        aggregate: jest.fn().mockResolvedValue({ _sum: { peopleCount: 5 } }),
      },
      payment: { updateMany: paymentUpdateMany },
      event: {
        findUniqueOrThrow: jest.fn(),
        update: eventUpdate,
      },
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'evt-1', capacity: 10 }]),
    };

    const prisma = {
      $transaction: jest.fn(async (fn: (t: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    };

    const service = new PaymentsService(
      prisma as never,
      { get: jest.fn() } as never,
      { issueForRegistration: jest.fn() } as never,
      { enqueue: jest.fn() } as never,
      { onCapacityFreed: jest.fn() } as never,
    );

    const did = await service.expireRegistration('reg-1');
    expect(did).toBe(true);
    expect(regUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: RegistrationStatus.EXPIRED },
      }),
    );
    expect(reservationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'RELEASED' }),
      }),
    );
  });
});
