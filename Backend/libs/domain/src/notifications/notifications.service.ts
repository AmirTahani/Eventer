import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Idempotent enqueue via unique `dedupeKey`. Duplicate keys are ignored.
   */
  async enqueue(
    input: EnqueueNotificationInput,
  ): Promise<{ id: string } | null> {
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

  private botToken(): string | undefined {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token || token === 'dev-bot-token-for-local-tests') return undefined;
    return token;
  }

  private async sendTelegramMessage(
    telegramUserId: bigint,
    text: string,
  ): Promise<string | null> {
    const token = this.botToken();
    if (!token) return null;

    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramUserId.toString(),
          text,
        }),
      },
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Telegram API ${res.status}: ${body}`);
    }
    const json = (await res.json()) as {
      result?: { message_id?: number };
    };
    return json.result?.message_id?.toString() ?? 'ok';
  }

  /**
   * Worker entry: deliver PENDING notifications via Telegram when a bot token
   * is configured; otherwise leave PENDING with an attempt note (do not fake SENT).
   */
  async dispatchPending(limit = 50): Promise<{ sent: number; failed: number }> {
    const pending = await this.prisma.notification.findMany({
      where: { status: NotificationStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      take: limit,
      include: { recipient: true },
    });

    let sent = 0;
    let failed = 0;
    const token = this.botToken();

    for (const n of pending) {
      const attempts = n.attempts + 1;
      try {
        if (!token) {
          // No real delivery channel — stay PENDING so organizers can see backlog;
          // cap attempts so we don't spin forever without a token.
          if (attempts >= 3) {
            await this.prisma.notification.update({
              where: { id: n.id },
              data: {
                attempts,
                status: NotificationStatus.FAILED,
                error: 'TELEGRAM_BOT_TOKEN not configured',
              },
            });
            failed += 1;
          } else {
            await this.prisma.notification.update({
              where: { id: n.id },
              data: {
                attempts,
                error: 'waiting for TELEGRAM_BOT_TOKEN',
              },
            });
            this.logger.warn(
              `[telegram] skipped ${n.type} — bot token not configured`,
            );
          }
          continue;
        }

        const text = `Eventer: ${n.type} (${n.entityType} ${n.entityId})`;
        const messageId = await this.sendTelegramMessage(
          n.recipient.telegramUserId,
          text,
        );
        await this.prisma.notification.update({
          where: { id: n.id },
          data: {
            status: NotificationStatus.SENT,
            attempts,
            sentAt: new Date(),
            providerMessageId: messageId,
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
