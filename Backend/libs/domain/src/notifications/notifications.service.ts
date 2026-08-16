import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '@eventer/db';

export type EnqueueNotificationInput = {
  recipientUserId: string;
  type: string;
  entityType: string;
  entityId: string;
  dedupeKey: string;
  channel?: NotificationChannel;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Idempotent enqueue via unique `dedupeKey`. Duplicate keys are ignored.
   */
  async enqueue(input: EnqueueNotificationInput): Promise<{ id: string } | null> {
    const channel = input.channel ?? NotificationChannel.TELEGRAM;
    try {
      const row = await this.prisma.notification.create({
        data: {
          recipientUserId: input.recipientUserId,
          type: input.type,
          entityType: input.entityType,
          entityId: input.entityId,
          channel,
          status: NotificationStatus.PENDING,
          dedupeKey: input.dedupeKey,
        },
      });
      this.logger.log(
        `Enqueued ${input.type} → ${input.recipientUserId} (${row.id})`,
      );
      return { id: row.id };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        this.logger.debug(`Dedupe skip: ${input.dedupeKey}`);
        return null;
      }
      throw err;
    }
  }

  async enqueueMany(inputs: EnqueueNotificationInput[]): Promise<number> {
    let created = 0;
    for (const input of inputs) {
      const row = await this.enqueue(input);
      if (row) created += 1;
    }
    return created;
  }

  /**
   * Worker entry: mark PENDING notifications SENT (or FAILED after 3 attempts).
   * Real Telegram send is stubbed — if no bot token, still mark SENT after logging.
   */
  async dispatchPending(limit = 50): Promise<{ sent: number; failed: number }> {
    const pending = await this.prisma.notification.findMany({
      where: { status: NotificationStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    let sent = 0;
    let failed = 0;

    for (const n of pending) {
      const attempts = n.attempts + 1;
      try {
        // Stub delivery — TelegramDeliveryWorker calls this path.
        this.logger.log(
          `[telegram-stub] type=${n.type} recipient=${n.recipientUserId} entity=${n.entityType}:${n.entityId}`,
        );
        await this.prisma.notification.update({
          where: { id: n.id },
          data: {
            status: NotificationStatus.SENT,
            attempts,
            sentAt: new Date(),
            providerMessageId: `stub-${n.id}`,
            error: null,
          },
        });
        sent += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const status =
          attempts >= 3
            ? NotificationStatus.FAILED
            : NotificationStatus.PENDING;
        await this.prisma.notification.update({
          where: { id: n.id },
          data: {
            attempts,
            status,
            error: message,
          },
        });
        if (status === NotificationStatus.FAILED) failed += 1;
      }
    }

    return { sent, failed };
  }

  /** Simulate a failed delivery attempt (for tests / forced failure path). */
  async recordDeliveryFailure(notificationId: string, error: string) {
    const n = await this.prisma.notification.findUniqueOrThrow({
      where: { id: notificationId },
    });
    const attempts = n.attempts + 1;
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        attempts,
        status:
          attempts >= 3
            ? NotificationStatus.FAILED
            : NotificationStatus.PENDING,
        error,
      },
    });
  }
}
