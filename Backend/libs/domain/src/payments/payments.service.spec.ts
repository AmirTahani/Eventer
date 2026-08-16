import { createHmac } from 'node:crypto';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PaymentStatus, RegistrationStatus } from '@prisma/client';
import { MockPaymentProvider } from './payment-provider';
import { OrcaRailPaymentProvider } from './orcarail.provider';
import { PaymentsService } from './payments.service';

function configMap(values: Record<string, string | undefined>) {
  return {
    get: jest.fn((key: string) => values[key]),
  };
}

describe('MockPaymentProvider', () => {
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

  it('creates a deterministic mock checkout URL', async () => {
    await expect(
      provider.createIntent({
        paymentId: 'pay-9',
        amount: '10.00',
        currency: 'USD',
        registrationId: 'reg-9',
      }),
    ).resolves.toEqual({
      provider: 'mock',
      providerTransactionId: 'mock_txn_pay-9',
      checkoutUrl: 'https://provider.example/checkout/mock_txn_pay-9',
    });
  });

  it('parses webhook bodies', () => {
    expect(
      provider.parseWebhook({
        transactionId: 't1',
        status: 'processing',
        amount: 5,
        currency: 'usd',
        metadata: { paymentId: 'p1' },
      }),
    ).toEqual({
      transactionId: 't1',
      status: 'processing',
      amount: '5',
      currency: 'usd',
      metadata: { paymentId: 'p1' },
    });
  });
});

describe('PaymentsService provider factory', () => {
  it('defaults to MockPaymentProvider', () => {
    const service = new PaymentsService(
      {} as never,
      configMap({}) as never,
      { issueForRegistration: jest.fn() } as never,
      { enqueue: jest.fn() } as never,
      { onCapacityFreed: jest.fn() } as never,
    );
    expect(
      (service as unknown as { provider: { name: string } }).provider.name,
    ).toBe('mock');
  });

  it('builds OrcaRailPaymentProvider when PAYMENT_PROVIDER=orcarail', () => {
    const service = new PaymentsService(
      {} as never,
      configMap({
        PAYMENT_PROVIDER: 'orcarail',
        ORCARAIL_API_KEY: 'ak',
        ORCARAIL_API_SECRET: 'sk',
        ORCARAIL_TOKEN_ID: 'tok',
        ORCARAIL_NETWORK_ID: 'net',
        ORCARAIL_RETURN_URL: 'http://localhost:3001/payments/return',
        ORCARAIL_BASE_URL: 'https://selfhost.example/api/v1',
        ORCARAIL_CANCEL_URL: 'http://localhost:3001/payments/cancel',
      }) as never,
      { issueForRegistration: jest.fn() } as never,
      { enqueue: jest.fn() } as never,
      { onCapacityFreed: jest.fn() } as never,
    );
    const provider = (service as unknown as { provider: { name: string } })
      .provider;
    expect(provider).toBeInstanceOf(OrcaRailPaymentProvider);
    expect(provider.name).toBe('orcarail');
  });

  it('throws when orcarail config is incomplete', () => {
    expect(
      () =>
        new PaymentsService(
          {} as never,
          configMap({ PAYMENT_PROVIDER: 'orcarail' }) as never,
          { issueForRegistration: jest.fn() } as never,
          { enqueue: jest.fn() } as never,
          { onCapacityFreed: jest.fn() } as never,
        ),
    ).toThrow(/ORCARAIL_API_KEY/);
  });
});

describe('PaymentsService.createIntent', () => {
  const user = { id: 'u-1' } as never;

  it('rejects missing registration, wrong owner, and bad status', async () => {
    const prisma = {
      eventRegistration: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            id: 'reg-1',
            primaryUserId: 'other',
            status: RegistrationStatus.PENDING_PAYMENT,
            payments: [],
          })
          .mockResolvedValueOnce({
            id: 'reg-1',
            primaryUserId: 'u-1',
            status: RegistrationStatus.CONFIRMED,
            payments: [],
          }),
      },
    };
    const service = new PaymentsService(
      prisma as never,
      configMap({}) as never,
      { issueForRegistration: jest.fn() } as never,
      { enqueue: jest.fn() } as never,
      { onCapacityFreed: jest.fn() } as never,
    );

    await expect(service.createIntent(user, 'reg-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.createIntent(user, 'reg-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.createIntent(user, 'reg-1')).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('creates a new payment row and stores providerTransactionId', async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    const prisma = {
      eventRegistration: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'reg-1',
          primaryUserId: 'u-1',
          status: RegistrationStatus.PENDING_PAYMENT,
          priceSnapshot: '10.00',
          peopleCount: 2,
          currency: 'USD',
          expiresAt: null,
          payments: [],
        }),
        update: jest.fn().mockResolvedValue({}),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'reg-1',
          expiresAt,
        }),
      },
      payment: {
        create: jest.fn().mockResolvedValue({
          id: 'pay-new',
          attemptNumber: 1,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const service = new PaymentsService(
      prisma as never,
      configMap({}) as never,
      { issueForRegistration: jest.fn() } as never,
      { enqueue: jest.fn() } as never,
      { onCapacityFreed: jest.fn() } as never,
    );

    const result = await service.createIntent(user, 'reg-1');
    expect(result).toMatchObject({
      paymentId: 'pay-new',
      provider: 'mock',
      checkoutUrl: expect.stringContaining('mock_txn_pay-new'),
      amount: '20.00',
      currency: 'USD',
    });
    expect(prisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { providerTransactionId: 'mock_txn_pay-new' },
      }),
    );
    expect(prisma.eventRegistration.update).toHaveBeenCalled();
  });

  it('reuses CREATED payment and refreshes providerTransactionId', async () => {
    const prisma = {
      eventRegistration: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'reg-1',
          primaryUserId: 'u-1',
          status: RegistrationStatus.PENDING_PAYMENT,
          priceSnapshot: '5.00',
          peopleCount: 1,
          currency: 'EUR',
          expiresAt: new Date('2030-01-01T00:00:00.000Z'),
          payments: [
            {
              id: 'pay-existing',
              status: PaymentStatus.CREATED,
              attemptNumber: 1,
            },
          ],
        }),
      },
      payment: {
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const service = new PaymentsService(
      prisma as never,
      configMap({}) as never,
      { issueForRegistration: jest.fn() } as never,
      { enqueue: jest.fn() } as never,
      { onCapacityFreed: jest.fn() } as never,
    );

    const result = await service.createIntent(user, 'reg-1');
    expect(result.paymentId).toBe('pay-existing');
    expect(prisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pay-existing' },
        data: { providerTransactionId: 'mock_txn_pay-existing' },
      }),
    );
  });

  it('rejects when last payment already succeeded', async () => {
    const service = new PaymentsService(
      {
        eventRegistration: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'reg-1',
            primaryUserId: 'u-1',
            status: RegistrationStatus.PENDING_PAYMENT,
            payments: [{ id: 'pay-1', status: PaymentStatus.SUCCEEDED }],
          }),
        },
      } as never,
      configMap({}) as never,
      { issueForRegistration: jest.fn() } as never,
      { enqueue: jest.fn() } as never,
      { onCapacityFreed: jest.fn() } as never,
    );
    await expect(service.createIntent(user, 'reg-1')).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });
});

describe('PaymentsService webhook handling', () => {
  function build(
    prisma: Record<string, unknown>,
    env: Record<string, string | undefined> = {
      PAYMENT_WEBHOOK_SECRET: 'dev-payment-webhook-secret',
    },
  ) {
    return new PaymentsService(
      prisma as never,
      configMap(env) as never,
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

  it('rejects unknown provider and bad signatures', async () => {
    const service = build({ payment: {} });
    await expect(
      service.handleWebhook('orcarail', '{}', 'sig', {}),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.handleWebhook('mock', '{}', 'bad', {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('confirms on succeeded webhook and marks failed/processing', async () => {
    const payment = {
      id: 'pay-1',
      status: PaymentStatus.CREATED,
      registrationId: 'reg-1',
      providerTransactionId: null,
    };
    const update = jest.fn().mockResolvedValue({});
    const service = build({
      payment: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(payment),
        update,
      },
    });
    const confirmSpy = jest.fn().mockResolvedValue(undefined);
    (
      service as unknown as { confirmPayment: typeof confirmSpy }
    ).confirmPayment = confirmSpy;

    const succeededBody = {
      transactionId: 'txn_ok',
      status: 'succeeded' as const,
      metadata: { paymentId: 'pay-1' },
    };
    const rawOk = JSON.stringify(succeededBody);
    const sigOk = createHmac('sha256', 'dev-payment-webhook-secret')
      .update(rawOk)
      .digest('hex');
    await service.handleWebhook('mock', rawOk, sigOk, succeededBody);
    expect(confirmSpy).toHaveBeenCalledWith('pay-1', 'txn_ok', succeededBody);

    const failedBody = {
      transactionId: 'txn_fail',
      status: 'failed' as const,
      metadata: { paymentId: 'pay-1' },
    };
    const rawFail = JSON.stringify(failedBody);
    const sigFail = createHmac('sha256', 'dev-payment-webhook-secret')
      .update(rawFail)
      .digest('hex');
    await service.handleWebhook('mock', rawFail, sigFail, failedBody);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: PaymentStatus.FAILED }),
      }),
    );

    const processingBody = {
      transactionId: 'txn_proc',
      status: 'processing' as const,
      metadata: { paymentId: 'pay-1' },
    };
    const rawProc = JSON.stringify(processingBody);
    const sigProc = createHmac('sha256', 'dev-payment-webhook-secret')
      .update(rawProc)
      .digest('hex');
    await service.handleWebhook('mock', rawProc, sigProc, processingBody);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: PaymentStatus.PROCESSING }),
      }),
    );
  });

  it('uses ORCARAIL_WEBHOOK_SECRET for orcarail provider', async () => {
    const service = build(
      {
        payment: {
          findFirst: jest.fn().mockResolvedValue(null),
          findUnique: jest.fn().mockResolvedValue(null),
        },
      },
      {
        PAYMENT_PROVIDER: 'orcarail',
        ORCARAIL_API_KEY: 'ak',
        ORCARAIL_API_SECRET: 'sk',
        ORCARAIL_TOKEN_ID: 'tok',
        ORCARAIL_NETWORK_ID: 'net',
        ORCARAIL_RETURN_URL: 'http://localhost:3001/payments/return',
        ORCARAIL_WEBHOOK_SECRET: 'orca-secret',
      },
    );

    const body = JSON.stringify({
      type: 'payment_intent.completed',
      data: { object: { id: 'pi_1', metadata: { paymentId: 'pay-1' } } },
    });
    const bad = createHmac('sha256', 'dev-payment-webhook-secret')
      .update(body)
      .digest('hex');
    await expect(
      service.handleWebhook('orcarail', body, bad, JSON.parse(body)),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    const good = createHmac('sha256', 'orca-secret').update(body).digest('hex');
    await expect(
      service.handleWebhook('orcarail', body, good, JSON.parse(body)),
    ).resolves.toEqual({ received: true });
  });

  it('acks when transactionId is empty', async () => {
    const service = build({ payment: { findFirst: jest.fn() } });
    const body = JSON.stringify({ transactionId: '', status: 'succeeded' });
    const sig = createHmac('sha256', 'dev-payment-webhook-secret')
      .update(body)
      .digest('hex');
    await expect(
      service.handleWebhook('mock', body, sig, JSON.parse(body)),
    ).resolves.toEqual({ received: true });
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
      configMap({}) as never,
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

describe('PaymentsService.confirmPayment expiry race', () => {
  it('does not confirm when registration is already EXPIRED', async () => {
    const paymentUpdate = jest.fn().mockResolvedValue({});
    const regUpdate = jest.fn();
    const regUpdateMany = jest.fn();
    const payment = {
      id: 'pay-1',
      status: PaymentStatus.CREATED,
      registrationId: 'reg-1',
      registration: {
        id: 'reg-1',
        eventId: 'evt-1',
        status: RegistrationStatus.EXPIRED,
        primaryUserId: 'u-1',
        expiresAt: new Date(Date.now() - 1000),
      },
    };
    const tx = {
      payment: {
        findUnique: jest.fn().mockResolvedValue(payment),
        update: paymentUpdate,
      },
      eventRegistration: {
        findUnique: jest.fn().mockResolvedValue(payment.registration),
        update: regUpdate,
        updateMany: regUpdateMany,
      },
      capacityReservation: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      event: {
        findUniqueOrThrow: jest.fn(),
      },
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'evt-1', capacity: 10 }]),
    };
    const prisma = {
      $transaction: jest.fn(async (fn: (t: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    };
    const tickets = { issueForRegistration: jest.fn() };
    const notifications = { enqueue: jest.fn() };
    const service = new PaymentsService(
      prisma as never,
      configMap({}) as never,
      tickets as never,
      notifications as never,
      { onCapacityFreed: jest.fn() } as never,
    );

    await service.confirmPayment('pay-1', 'txn_late', {});
    expect(regUpdateMany).not.toHaveBeenCalled();
    expect(tickets.issueForRegistration).not.toHaveBeenCalled();
    expect(paymentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: PaymentStatus.CANCELLED }),
      }),
    );
  });

  it('refuses confirm when capacity reservation was already released', async () => {
    const paymentUpdate = jest.fn().mockResolvedValue({});
    const reg = {
      id: 'reg-1',
      eventId: 'evt-1',
      status: RegistrationStatus.PENDING_PAYMENT,
      primaryUserId: 'u-1',
      expiresAt: new Date(Date.now() + 60_000),
    };
    const payment = {
      id: 'pay-1',
      status: PaymentStatus.CREATED,
      registrationId: 'reg-1',
      registration: reg,
    };
    const tx = {
      payment: {
        findUnique: jest.fn().mockResolvedValue(payment),
        update: paymentUpdate,
      },
      eventRegistration: {
        findUnique: jest.fn().mockResolvedValue(reg),
        updateMany: jest.fn(),
      },
      capacityReservation: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'cap-1',
          status: 'RELEASED',
        }),
      },
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'evt-1', capacity: 10 }]),
    };
    const prisma = {
      $transaction: jest.fn(async (fn: (t: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    };
    const tickets = { issueForRegistration: jest.fn() };
    const service = new PaymentsService(
      prisma as never,
      configMap({}) as never,
      tickets as never,
      { enqueue: jest.fn() } as never,
      { onCapacityFreed: jest.fn() } as never,
    );

    await service.confirmPayment('pay-1', 'txn_x', {});
    expect(tickets.issueForRegistration).not.toHaveBeenCalled();
    expect(tx.eventRegistration.updateMany).not.toHaveBeenCalled();
  });

  it('issues tickets and notifies on successful confirm', async () => {
    const reg = {
      id: 'reg-1',
      eventId: 'evt-1',
      status: RegistrationStatus.PENDING_PAYMENT,
      primaryUserId: 'u-1',
      expiresAt: new Date(Date.now() + 60_000),
    };
    const payment = {
      id: 'pay-1',
      status: PaymentStatus.CREATED,
      registrationId: 'reg-1',
      registration: reg,
    };
    const tx = {
      payment: {
        findUnique: jest.fn().mockResolvedValue(payment),
        update: jest.fn().mockResolvedValue({}),
      },
      eventRegistration: {
        findUnique: jest.fn().mockResolvedValue(reg),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      capacityReservation: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'cap-1',
          status: 'ACTIVE',
        }),
      },
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'evt-1', capacity: 10 }]),
    };
    const prisma = {
      $transaction: jest.fn(async (fn: (t: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    };
    const tickets = { issueForRegistration: jest.fn().mockResolvedValue([]) };
    const notifications = { enqueue: jest.fn().mockResolvedValue(null) };
    const service = new PaymentsService(
      prisma as never,
      configMap({}) as never,
      tickets as never,
      notifications as never,
      { onCapacityFreed: jest.fn() } as never,
    );

    await service.confirmPayment('pay-1', 'txn_ok', { ok: true });
    expect(tickets.issueForRegistration).toHaveBeenCalledWith('reg-1');
    expect(notifications.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'registration.confirmed',
        recipientUserId: 'u-1',
      }),
    );
  });
});
