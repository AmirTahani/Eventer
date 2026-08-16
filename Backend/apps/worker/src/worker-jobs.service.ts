import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  EventRemindersService,
  EventsService,
  NotificationsService,
  PaymentsService,
  WaitlistService,
} from '@eventer/domain';

const TICK_MS = 15_000;

/**
 * Minimal worker loop: waitlist offer expiry, payment expiry, notification dispatch,
 * reminders, and event COMPLETED transitions.
 */
@Injectable()
export class WorkerJobsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerJobsService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly waitlist: WaitlistService,
    private readonly payments: PaymentsService,
    private readonly notifications: NotificationsService,
    private readonly reminders: EventRemindersService,
    private readonly events: EventsService,
  ) {}

  onModuleInit(): void {
    this.logger.log(`Starting reconcile loop every ${TICK_MS}ms`);
    this.timer = setInterval(() => {
      void this.tick();
    }, TICK_MS);
    void this.tick();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const waitlist = await this.waitlist.reconcileExpiredOffers();
      const payments = await this.payments.expireStalePayments();
      const notes = await this.notifications.dispatchPending();
      const reminders = await this.reminders.reconcileReminders();
      const completed = await this.events.markCompletedEvents();
      if (
        waitlist.expired ||
        payments.expired ||
        notes.sent ||
        notes.failed ||
        reminders.scheduled ||
        completed.completed
      ) {
        this.logger.log(
          `tick waitlist.expired=${waitlist.expired} payments.expired=${payments.expired} notifications.sent=${notes.sent} failed=${notes.failed} reminders.scheduled=${reminders.scheduled} events.completed=${completed.completed}`,
        );
      }
    } catch (err) {
      this.logger.error(
        `Worker tick failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      this.running = false;
    }
  }
}
