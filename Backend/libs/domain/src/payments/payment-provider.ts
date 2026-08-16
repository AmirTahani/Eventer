import { createHmac, timingSafeEqual } from 'node:crypto';

export type CreatePaymentIntentInput = {
  paymentId: string;
  amount: string;
  currency: string;
  registrationId: string;
};

export type CreatePaymentIntentResult = {
  provider: string;
  checkoutUrl: string;
  providerTransactionId: string;
};

export type WebhookPayload = {
  transactionId: string;
  status: 'succeeded' | 'failed' | 'processing';
  amount?: string;
  currency?: string;
  metadata?: { paymentId?: string };
};

export interface PaymentProvider {
  readonly name: string;
  createIntent(
    input: CreatePaymentIntentInput,
  ): Promise<CreatePaymentIntentResult>;
  verifyWebhookSignature(
    rawBody: string,
    signatureHeader: string | undefined,
    secret: string,
  ): boolean;
  parseWebhook(body: unknown): WebhookPayload;
}

export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';

  createIntent(
    input: CreatePaymentIntentInput,
  ): Promise<CreatePaymentIntentResult> {
    const providerTransactionId = `mock_txn_${input.paymentId}`;
    return Promise.resolve({
      provider: this.name,
      checkoutUrl: `https://provider.example/checkout/${providerTransactionId}`,
      providerTransactionId,
    });
  }

  verifyWebhookSignature(
    rawBody: string,
    signatureHeader: string | undefined,
    secret: string,
  ): boolean {
    if (!signatureHeader) return false;
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const provided = signatureHeader.replace(/^sha256=/i, '');
    try {
      const a = Buffer.from(provided);
      const b = Buffer.from(expected);
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  parseWebhook(body: unknown): WebhookPayload {
    const b = body as Record<string, unknown>;
    const metadata = (b.metadata ?? {}) as { paymentId?: string };
    return {
      transactionId: unknownToString(b.transactionId),
      status: (b.status as WebhookPayload['status']) ?? 'failed',
      amount: b.amount != null ? unknownToString(b.amount) : undefined,
      currency: b.currency != null ? unknownToString(b.currency) : undefined,
      metadata,
    };
  }
}

function unknownToString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'bigint') return value.toString();
  return '';
}
