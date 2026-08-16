import { Injectable, Logger } from '@nestjs/common';
import { EventStatus, RegistrationStatus } from '@prisma/client';
import { PrismaService } from '@eventer/db';
import { NotificationsService } from '../notifications/notifications.service';

export const REMINDER_OFFSETS = [
  { key: '24h', ms: 24 * 60 * 60 * 1000 },
  { key: '2h', ms: 2 * 60 * 60 * 1000 },
  { key: '30min', ms: 30 * 60 * 1000 },
] as const;

export type ReminderOffsetKey = (typeof REMINDER_OFFSETS)[number]['key'];

/**
 * Schedules / reconciles event reminders for CONFIRMED registrants.
 * Uses notification dedupe keys so reconcile is idempotent.
 */
@Injectable()
export class EventRemindersService {
  private readonly logger = new Logger(EventRemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Which reminder offsets should fire for an event at `now`. */
  dueOffsets(startAt: Date, now: Date = new Date()): ReminderOffsetKey[] {
    const startMs = startAt.getTime();
    const nowMs = now.getTime();
    if (nowMs >= startMs) return [];

    return REMINDER_OFFSETS.filter((o) => {
      const fireAt = startMs - o.ms;
      return nowMs >= fireAt;
    }).map((o) => o.key);
  }

  /**
   * For a single event: enqueue due reminder notifications for confirmed users.
   */
  async scheduleForEvent(
    eventId: string,
    now: Date = new Date(),
  ): Promise<number> {
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
        status: { in: [EventStatus.OPEN, EventStatus.FULL] },
      },
      select: { id: true, startAt: true, name: true },
    });
    if (!event) return 0;

    const due = this.dueOffsets(event.startAt, now);
    if (due.length === 0) return 0;

    const confirmed = await this.prisma.eventRegistration.findMany({
      where: {
        eventId,
        status: RegistrationStatus.CONFIRMED,
      },
      select: { primaryUserId: true },
    });

    let created = 0;
    for (const offset of due) {
      for (const reg of confirmed) {
        const row = await this.notifications.enqueue({
          recipientUserId: reg.primaryUserId,
          type: `event.reminder.${offset}`,
          entityType: 'Event',
          entityId: eventId,
          dedupeKey: `event:${eventId}:reminder:${offset}:user:${reg.primaryUserId}`,
        });
        if (row) created += 1;
      }
    }
    return created;
  }

  /**
   * Worker sweep: find upcoming events and enqueue any due reminders.
   */
  async reconcileReminders(now: Date = new Date()): Promise<{ scheduled: number }> {
    const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const events = await this.prisma.event.findMany({
      where: {
        deletedAt: null,
        status: { in: [EventStatus.OPEN, EventStatus.FULL] },
        startAt: { gt: now, lte: horizon },
      },
      select: { id: true },
    });

    let scheduled = 0;
    for (const event of events) {
      scheduled += await this.scheduleForEvent(event.id, now);
    }

    if (scheduled > 0) {
      this.logger.log(`reconcileReminders scheduled=${scheduled}`);
    }
    return { scheduled };
  }
}
