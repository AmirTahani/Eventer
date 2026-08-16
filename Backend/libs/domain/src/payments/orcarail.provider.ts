import { createHmac, timingSafeEqual } from 'node:crypto';
import { OrcaRail } from '@orcarail/node';
import type {
  CreatePaymentIntentInput,
  CreatePaymentIntentResult,
  PaymentProvider,
  WebhookPayload,
} from './payment-provider';

export type OrcaRailProviderConfig = {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  tokenId: string;
  networkId: string;
  returnUrl: string;
  cancelUrl?: string;
};

type OrcaRailWebhookBody = {
  type?: string;
  data?: {
    object?: {
      id?: string;
      amount?: string | number;
      currency?: string;
      metadata?: Record<string, unknown> | null;
      status?: string;
    };
  };
};

/**
 * Maps OrcaRail Payment Intent webhooks into Eventer's provider-agnostic payload.
 * Exported for unit tests (no live API calls).
 */
export function mapOrcaRailWebhook(body: unknown): WebhookPayload {
  const event = (body ?? {}) as OrcaRailWebhookBody;
  const obj = event.data?.object ?? {};
  const metadata = (obj.metadata ?? {}) as { paymentId?: string };
  const type = String(event.type ?? '');

  let status: WebhookPayload['status'] = 'failed';
  if (
    type === 'payment_intent.completed' ||
    type === 'payment_intent.succeeded' ||
    obj.status === 'completed'
  ) {
    status = 'succeeded';
  } else if (
    type === 'payment_intent.processing' ||
    obj.status === 'processing'
  ) {
    status = 'processing';
  } else if (
    type === 'payment_intent.canceled' ||
    type === 'payment_intent.requires_payment_method' ||
    obj.status === 'canceled' ||
    obj.status === 'requires_payment_method'
  ) {
    status = 'failed';
  }

  return {
    transactionId: String(obj.id ?? ''),
    status,
    amount: obj.amount != null ? String(obj.amount) : undefined,
    currency: obj.currency != null ? String(obj.currency) : undefined,
    metadata: {
      paymentId:
        typeof metadata.paymentId === 'string' ? metadata.paymentId : undefined,
    },
  };
}

export class OrcaRailPaymentProvider implements PaymentProvider {
  readonly name = 'orcarail';
  private readonly client: OrcaRail;
  private readonly tokenId: string;
  private readonly networkId: string;
  private readonly returnUrl: string;
  private readonly cancelUrl?: string;

  constructor(config: OrcaRailProviderConfig) {
    this.client = new OrcaRail(config.apiKey, config.apiSecret, {
      baseUrl: config.baseUrl,
    });
    this.tokenId = config.tokenId;
    this.networkId = config.networkId;
    this.returnUrl = config.returnUrl;
    this.cancelUrl = config.cancelUrl;
  }

  async createIntent(
    input: CreatePaymentIntentInput,
  ): Promise<CreatePaymentIntentResult> {
    const intent = await this.client.paymentIntents.create({
      amount: input.amount,
      currency: input.currency.toLowerCase(),
      payment_method_types: ['crypto'],
      tokenId: this.tokenId,
      networkId: this.networkId,
      return_url: this.returnUrl,
      cancel_url: this.cancelUrl ?? null,
      description: `Eventer registration ${input.registrationId}`,
      metadata: {
        paymentId: input.paymentId,
        registrationId: input.registrationId,
      },
    });

    if (!intent.client_secret) {
      throw new Error('OrcaRail createIntent response missing client_secret');
    }

    const confirmed = await this.client.paymentIntents.confirm(intent.id, {
      client_secret: intent.client_secret,
      return_url: this.returnUrl,
    });

    const extended = confirmed as typeof confirmed & {
      nextAction?: { redirectToUrl?: { url?: string } };
    };
    const checkoutUrl =
      confirmed.pay_url ??
      confirmed.payment_link?.link ??
      extended.nextAction?.redirectToUrl?.url;

    if (!checkoutUrl) {
      throw new Error('OrcaRail confirm did not return a hosted pay URL');
    }

    return {
      provider: this.name,
      providerTransactionId: confirmed.id,
      checkoutUrl,
    };
  }

  verifyWebhookSignature(
    rawBody: string,
    signatureHeader: string | undefined,
    secret: string,
  ): boolean {
    if (!signatureHeader) return false;
    try {
      return this.client.webhooks.verifySignature(
        rawBody,
        signatureHeader,
        secret,
      );
    } catch {
      // Fallback HMAC if SDK throws (mirrors mock / docs)
      const expected = createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');
      const provided = signatureHeader.replace(/^sha256=/i, '');
      try {
        const a = Buffer.from(provided);
        const b = Buffer.from(expected);
        return a.length === b.length && timingSafeEqual(a, b);
      } catch {
        return false;
      }
    }
  }

  parseWebhook(body: unknown): WebhookPayload {
    return mapOrcaRailWebhook(body);
  }
}
