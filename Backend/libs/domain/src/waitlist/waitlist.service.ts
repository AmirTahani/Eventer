import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  CapacityReservationStatus,
  EventStatus,
  RegistrationStatus,
  WaitlistStatus,
} from '@prisma/client';
import { PrismaService } from '@eventer/db';
import { AuthUser, canManageEvent } from '../auth/policies';
import { lockEventRow, sumActiveReservations } from '../registrations/capacity';
import { NotificationsService } from '../notifications/notifications.service';

export const WAITLIST_OFFER_TTL_MS = 60 * 60 * 1000;
export const PAYMENT_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async listForEvent(user: AuthUser, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (!canManageEvent(user, event.organizerId)) {
      throw new ForbiddenException('Not allowed to view waitlist');
    }

    const entries = await this.prisma.waitlistEntry.findMany({
      where: { eventId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            telegramUsername: true,
          },
        },
      },
    });

    return {
      items: entries.map((e) => ({
        id: e.id,
        userId: e.userId,
        peopleCount: e.peopleCount,
        position: e.position,
        status: e.status,
        offerExpiresAt: e.offerExpiresAt?.toISOString() ?? null,
        user: e.user,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  }

  /**
   * When capacity frees: offer next JOINED entry that fits remaining seats.
   * Creates a shadow ACTIVE capacity reservation on the WAITLISTED registration.
   */
  async offerNext(eventId: string): Promise<{ offeredId: string } | null> {
    const result = await this.prisma.$transaction(async (tx) => {
      const locked = await lockEventRow(tx, eventId);
      if (!locked) return null;

      const used = await sumActiveReservations(tx, eventId);
      const remaining = Math.max(0, locked.capacity - used);
      if (remaining <= 0) return null;

      const candidates = await tx.waitlistEntry.findMany({
        where: { eventId, status: WaitlistStatus.JOINED },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      });

      const next = candidates.find((c) => c.peopleCount <= remaining);
      if (!next) return null;

      const reg = await tx.eventRegistration.findFirst({
        where: {
          eventId,
          primaryUserId: next.userId,
          status: RegistrationStatus.WAITLISTED,
        },
      });
      if (!reg) {
        this.logger.warn(
          `Waitlist entry ${next.id} has no WAITLISTED registration`,
        );
        return null;
      }

      const offerExpiresAt = new Date(Date.now() + WAITLIST_OFFER_TTL_MS);

      await tx.waitlistEntry.update({
        where: { id: next.id },
        data: {
          status: WaitlistStatus.OFFERED,
          offerExpiresAt,
        },
      });

      const existingRes = await tx.capacityReservation.findUnique({
        where: { registrationId: reg.id },
      });
      if (existingRes) {
        if (existingRes.status !== CapacityReservationStatus.ACTIVE) {
          await tx.capacityReservation.update({
            where: { id: existingRes.id },
            data: {
              status: CapacityReservationStatus.ACTIVE,
              peopleCount: next.peopleCount,
              releasedAt: null,
            },
          });
        }
      } else {
        await tx.capacityReservation.create({
          data: {
            eventId,
            registrationId: reg.id,
            peopleCount: next.peopleCount,
            status: CapacityReservationStatus.ACTIVE,
          },
        });
      }

      const newUsed = used + next.peopleCount;
      if (newUsed >= locked.capacity) {
        await tx.event.update({
          where: { id: eventId },
          data: { status: EventStatus.FULL },
        });
      }

      return { entryId: next.id, userId: next.userId, offerExpiresAt };
    });

    if (!result) return null;

    await this.notifications.enqueue({
      recipientUserId: result.userId,
      type: 'waitlist.offered',
      entityType: 'WaitlistEntry',
      entityId: result.entryId,
      dedupeKey: `waitlist:${result.entryId}:offered:${result.offerExpiresAt.toISOString()}`,
    });

    return { offeredId: result.entryId };
  }

  /** Called after capacity is released (cancel / payment expiry). */
  async onCapacityFreed(eventId: string): Promise<void> {
    for (let i = 0; i < 20; i++) {
      const offered = await this.offerNext(eventId);
      if (!offered) break;
    }
  }

  async claim(user: AuthUser, entryId: string) {
    const entry = await this.prisma.waitlistEntry.findUnique({
      where: { id: entryId },
    });
    if (!entry) throw new NotFoundException('Waitlist entry not found');
    if (entry.userId !== user.id) {
      throw new ForbiddenException('Not your waitlist entry');
    }
    if (entry.status !== WaitlistStatus.OFFERED) {
      throw new UnprocessableEntityException('Waitlist offer is not active');
    }
    if (entry.offerExpiresAt && entry.offerExpiresAt.getTime() < Date.now()) {
      throw new UnprocessableEntityException('Waitlist offer has expired');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await lockEventRow(tx, entry.eventId);

      const fresh = await tx.waitlistEntry.findUniqueOrThrow({
        where: { id: entryId },
      });
      if (fresh.status !== WaitlistStatus.OFFERED) {
        throw new UnprocessableEntityException('Waitlist offer is not active');
      }

      const reg = await tx.eventRegistration.findFirst({
        where: {
          eventId: entry.eventId,
          primaryUserId: user.id,
          status: RegistrationStatus.WAITLISTED,
        },
      });
      if (!reg) {
        throw new UnprocessableEntityException(
          'No waitlisted registration found',
        );
      }

      await tx.waitlistEntry.update({
        where: { id: entryId },
        data: { status: WaitlistStatus.CLAIMED },
      });

      const expiresAt = new Date(Date.now() + PAYMENT_TTL_MS);
      return tx.eventRegistration.update({
        where: { id: reg.id },
        data: {
          status: RegistrationStatus.PENDING_PAYMENT,
          expiresAt,
        },
      });
    });

    return {
      id: updated.id,
      eventId: updated.eventId,
      status: updated.status,
      peopleCount: updated.peopleCount,
      expiresAt: updated.expiresAt?.toISOString() ?? null,
    };
  }

  /**
   * Expire overdue OFFERED entries, release shadow reservations, offer next.
   * Idempotent; safe for worker reconcile loops.
   */
  async reconcileExpiredOffers(): Promise<{ expired: number }> {
    const now = new Date();
    const overdue = await this.prisma.waitlistEntry.findMany({
      where: {
        status: WaitlistStatus.OFFERED,
        offerExpiresAt: { lte: now },
      },
      take: 50,
      orderBy: { offerExpiresAt: 'asc' },
    });

    let expired = 0;
    for (const entry of overdue) {
      const ok = await this.expireOffer(entry.id);
      if (ok) {
        expired += 1;
        await this.onCapacityFreed(entry.eventId);
      }
    }
    return { expired };
  }

  async expireOffer(entryId: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM waitlist_entries
        WHERE id = ${entryId} AND status = 'OFFERED'
        FOR UPDATE SKIP LOCKED
      `;
      if (!rows[0]) return false;

      const entry = await tx.waitlistEntry.findUniqueOrThrow({
        where: { id: entryId },
      });

      await lockEventRow(tx, entry.eventId);

      await tx.waitlistEntry.update({
        where: { id: entryId },
        data: {
          status: WaitlistStatus.EXPIRED,
          offerExpiresAt: null,
        },
      });

      const reg = await tx.eventRegistration.findFirst({
        where: {
          eventId: entry.eventId,
          primaryUserId: entry.userId,
          status: RegistrationStatus.WAITLISTED,
        },
        include: { capacityReservation: true },
      });

      if (
        reg?.capacityReservation &&
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

      const event = await tx.event.findUniqueOrThrow({
        where: { id: entry.eventId },
      });
      if (event.status === EventStatus.FULL) {
        const used = await sumActiveReservations(tx, entry.eventId);
        if (used < event.capacity) {
          await tx.event.update({
            where: { id: entry.eventId },
            data: { status: EventStatus.OPEN },
          });
        }
      }

      return true;
    });
  }
}

/** Milestone 8: waitlist offer/claim/expire */
