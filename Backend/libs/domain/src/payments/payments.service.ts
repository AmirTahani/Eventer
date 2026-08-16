import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CapacityReservationStatus,
  EventStatus,
  PaymentStatus,
  Prisma,
  RegistrationStatus,
} from '@prisma/client';
import { PrismaService } from '@eventer/db';
import { AuthUser } from '../auth/policies';
import { moneyMultiply, moneyString } from '../common/money';
import { NotificationsService } from '../notifications/notifications.service';
import {
  lockEventRow,
  sumActiveReservations,
} from '../registrations/capacity';
import { TicketsService } from '../tickets/tickets.service';
import { WaitlistService, PAYMENT_TTL_MS } from '../waitlist/waitlist.service';
import {
  MockPaymentProvider,
  PaymentProvider,
} from './payment-provider';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly provider: PaymentProvider;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly tickets: TicketsService,
    private readonly notifications: NotificationsService,
    private readonly waitlist: WaitlistService,
  ) {
    this.provider = new MockPaymentProvider();
  }

  private webhookSecret(): string {
    return (
      this.config.get<string>('PAYMENT_WEBHOOK_SECRET') ??
      'dev-payment-webhook-secret'
    );
  }

  async createIntent(user: AuthUser, registrationId: string) {
    const reg = await this.prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: { payments: { orderBy: { attemptNumber: 'desc' }, take: 1 } },
    });
    if (!reg) throw new NotFoundException('Registration not found');
    if (reg.primaryUserId !== user.id) {
      throw new ForbiddenException('Only the registration owner can pay');
    }
    if (reg.status !== RegistrationStatus.PENDING_PAYMENT) {
      throw new UnprocessableEntityException(
        'Registration is not awaiting payment',
      );
    }

    const last = reg.payments[0];
    if (last?.status === PaymentStatus.SUCCEEDED) {
      throw new UnprocessableEntityException('Payment already succeeded');
    }
    if (
      last?.status === PaymentStatus.CREATED ||
      last?.status === PaymentStatus.PROCESSING
    ) {
      const checkout = await this.provider.createIntent({
        paymentId: last.id,
        amount: moneyMultiply(reg.priceSnapshot, reg.peopleCount),
        currency: reg.currency,
        registrationId: reg.id,
      });
      return {
        paymentId: last.id,
        provider: checkout.provider,
        checkoutUrl: checkout.checkoutUrl,
        amount: moneyMultiply(reg.priceSnapshot, reg.peopleCount),
        currency: reg.currency,
        expiresAt: reg.expiresAt?.toISOString() ?? null,
      };
    }

    const attemptNumber = (last?.attemptNumber ?? 0) + 1;
    const amount = new Prisma.Decimal(
      moneyMultiply(reg.priceSnapshot, reg.peopleCount),
    );

    const payment = await this.prisma.payment.create({
      data: {
        registrationId: reg.id,
        amount,
        currency: reg.currency,
        provider: this.provider.name,
        status: PaymentStatus.CREATED,
        attemptNumber,
      },
    });

    const checkout = await this.provider.createIntent({
      paymentId: payment.id,
      amount: moneyString(amount),
      currency: reg.currency,
      registrationId: reg.id,
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { providerTransactionId: checkout.providerTransactionId },
    });

    if (!reg.expiresAt) {
      await this.prisma.eventRegistration.update({
        where: { id: reg.id },
        data: { expiresAt: new Date(Date.now() + PAYMENT_TTL_MS) },
      });
    }

    const refreshed = await this.prisma.eventRegistration.findUniqueOrThrow({
      where: { id: reg.id },
    });

    return {
      paymentId: payment.id,
      provider: checkout.provider,
      checkoutUrl: checkout.checkoutUrl,
      amount: moneyString(amount),
      currency: reg.currency,
      expiresAt: refreshed.expiresAt?.toISOString() ?? null,
    };
  }

  async handleWebhook(
    providerName: string,
    rawBody: string,
    signatureHeader: string | undefined,
    parsedBody: unknown,
  ) {
    if (providerName !== this.provider.name) {
      throw new NotFoundException(`Unknown payment provider: ${providerName}`);
    }
    if (
      !this.provider.verifyWebhookSignature(
        rawBody,
        signatureHeader,
        this.webhookSecret(),
      )
    ) {
      throw new UnauthorizedException('Invalid payment webhook signature');
    }

    const payload = this.provider.parseWebhook(parsedBody);
    if (!payload.transactionId) {
      return { received: true };
    }

    const existingByTxn = await this.prisma.payment.findFirst({
      where: {
        provider: providerName,
        providerTransactionId: payload.transactionId,
      },
    });
    if (existingByTxn?.status === PaymentStatus.SUCCEEDED) {
      return { received: true };
    }

    const paymentId =
      payload.metadata?.paymentId ?? existingByTxn?.id ?? null;
    if (!paymentId) {
      this.logger.warn('Webhook missing paymentId metadata');
      return { received: true };
    }

    const payment =
      existingByTxn ??
      (await this.prisma.payment.findUnique({ where: { id: paymentId } }));
    if (!payment) {
      return { received: true };
    }

    if (payload.status === 'succeeded') {
      await this.confirmPayment(payment.id, payload.transactionId, parsedBody);
    } else if (payload.status === 'failed') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          failedAt: new Date(),
          providerTransactionId: payload.transactionId,
          rawProviderPayload: parsedBody as Prisma.InputJsonValue,
        },
      });
    } else if (payload.status === 'processing') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PROCESSING,
          providerTransactionId: payload.transactionId,
          rawProviderPayload: parsedBody as Prisma.InputJsonValue,
        },
      });
    }

    return { received: true };
  }

  async confirmPayment(
    paymentId: string,
    providerTransactionId: string,
    rawPayload?: unknown,
  ) {
    const outcome = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { registration: true },
      });
      if (!payment) return null;
      if (payment.status === PaymentStatus.SUCCEEDED) {
        return {
          already: true as const,
          registrationId: payment.registrationId,
        };
      }

      try {
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.SUCCEEDED,
            paidAt: new Date(),
            providerTransactionId,
            rawProviderPayload: (rawPayload ??
              Prisma.JsonNull) as Prisma.InputJsonValue,
          },
        });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          return {
            already: true as const,
            registrationId: payment.registrationId,
          };
        }
        throw err;
      }

      await tx.eventRegistration.update({
        where: { id: payment.registrationId },
        data: {
          status: RegistrationStatus.CONFIRMED,
          expiresAt: null,
        },
      });

      return {
        already: false as const,
        registrationId: payment.registrationId,
        primaryUserId: payment.registration.primaryUserId,
      };
    });

    if (!outcome) return;

    await this.tickets.issueForRegistration(outcome.registrationId);

    if (!outcome.already && 'primaryUserId' in outcome) {
      await this.notifications.enqueue({
        recipientUserId: outcome.primaryUserId,
        type: 'registration.confirmed',
        entityType: 'EventRegistration',
        entityId: outcome.registrationId,
        dedupeKey: `registration:${outcome.registrationId}:confirmed`,
      });
    }
  }

  /**
   * Expire PENDING_PAYMENT registrations past expiresAt; release capacity.
   */
  async expireStalePayments(): Promise<{ expired: number }> {
    const now = new Date();
    const stale = await this.prisma.eventRegistration.findMany({
      where: {
        status: RegistrationStatus.PENDING_PAYMENT,
        expiresAt: { lte: now },
      },
      include: { capacityReservation: true, event: true },
      take: 50,
    });

    let expired = 0;
    for (const reg of stale) {
      const did = await this.expireRegistration(reg.id);
      if (did) {
        expired += 1;
        await this.notifications.enqueue({
          recipientUserId: reg.primaryUserId,
          type: 'payment.expired',
          entityType: 'EventRegistration',
          entityId: reg.id,
          dedupeKey: `registration:${reg.id}:payment-expired`,
        });
        await this.waitlist.onCapacityFreed(reg.eventId);
      }
    }
    return { expired };
  }

  async expireRegistration(registrationId: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const reg = await tx.eventRegistration.findUnique({
        where: { id: registrationId },
        include: { capacityReservation: true, event: true },
      });
      if (!reg || reg.status !== RegistrationStatus.PENDING_PAYMENT) {
        return false;
      }
      if (!reg.expiresAt || reg.expiresAt.getTime() > Date.now()) {
        return false;
      }

      await lockEventRow(tx, reg.eventId);

      await tx.eventRegistration.update({
        where: { id: registrationId },
        data: { status: RegistrationStatus.EXPIRED },
      });

      if (
        reg.capacityReservation &&
        reg.capacityReservation.status === CapacityReservationStatus.ACTIVE
      ) {
        await tx.capacityReservation.update({
          where: { id: reg.capacityReservation.id },
          data: {
            status: CapacityReservationStatus.RELEASED,
            releasedAt: new Date(),
          },
        });
      }

      await tx.payment.updateMany({
        where: {
          registrationId,
          status: {
            in: [PaymentStatus.CREATED, PaymentStatus.PROCESSING],
          },
        },
        data: { status: PaymentStatus.CANCELLED },
      });

      if (reg.event.status === EventStatus.FULL) {
        const used = await sumActiveReservations(tx, reg.eventId);
        if (used < reg.event.capacity) {
          await tx.event.update({
            where: { id: reg.eventId },
            data: { status: EventStatus.OPEN },
          });
        }
      }

      return true;
    });
  }
}

/** Milestone 9: mock payment provider + webhook idempotency */
