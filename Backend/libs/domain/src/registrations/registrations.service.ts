import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  CapacityOverrideStatus,
  CapacityReservationStatus,
  EventStatus,
  Prisma,
  RegistrationStatus,
  WaitlistStatus,
} from '@prisma/client';
import { PrismaService } from '@eventer/db';
import { AuthUser, canManageEvent } from '../auth/policies';
import {
  DuplicateRegistrationException,
  InsufficientCapacityException,
} from '../common/exceptions';
import { moneyMultiply, moneyString } from '../common/money';
import { EventsService } from '../events/events.service';
import { resolveActivePrice } from '../events/pricing-resolver';
import { NotificationsService } from '../notifications/notifications.service';
import { WaitlistService, PAYMENT_TTL_MS } from '../waitlist/waitlist.service';
import {
  decideCapacityOutcome,
  lockEventRow,
  sumActiveReservations,
} from './capacity';

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
    private readonly notifications: NotificationsService,
    private readonly waitlist: WaitlistService,
  ) {}

  private serializeRegistration(
    reg: {
      id: string;
      eventId: string;
      status: RegistrationStatus;
      peopleCount: number;
      priceSnapshot: Prisma.Decimal;
      currency: string;
      expiresAt: Date | null;
    },
    extra?: { waitlistPosition?: number; rejectionReason?: string | null },
  ) {
    const unit = moneyString(reg.priceSnapshot);
    const base = {
      id: reg.id,
      eventId: reg.eventId,
      status: reg.status,
      peopleCount: reg.peopleCount,
      priceSnapshot: unit,
      currency: reg.currency,
      totalAmount: moneyMultiply(reg.priceSnapshot, reg.peopleCount),
      expiresAt: reg.expiresAt?.toISOString() ?? null,
    };
    if (extra?.waitlistPosition !== undefined) {
      return { ...base, waitlistPosition: extra.waitlistPosition };
    }
    if (extra?.rejectionReason !== undefined) {
      return { ...base, rejectionReason: extra.rejectionReason };
    }
    return base;
  }

  async create(
    user: AuthUser,
    eventId: string,
    input: {
      peopleCount: number;
      guests?: Array<{
        telegramUserId?: string;
        telegramUsername?: string;
        firstName?: string;
        lastName?: string;
      }>;
    },
  ) {
    const event = await this.events.requireVisibleEvent(user, eventId);

    if (
      event.status !== EventStatus.OPEN &&
      event.status !== EventStatus.FULL
    ) {
      throw new UnprocessableEntityException(
        'Event is not open for registration',
      );
    }

    if (input.peopleCount < 1) {
      throw new UnprocessableEntityException('peopleCount must be >= 1');
    }
    if (input.peopleCount > event.maxPeoplePerRegistration) {
      throw new UnprocessableEntityException(
        `peopleCount exceeds maxPeoplePerRegistration (${event.maxPeoplePerRegistration})`,
      );
    }

    const guests = input.guests ?? [];
    if (guests.length !== input.peopleCount - 1) {
      throw new UnprocessableEntityException(
        'guests array length must equal peopleCount - 1',
      );
    }

    const price = resolveActivePrice(
      event.price,
      event.currency,
      event.pricingTiers,
    );
    const priceSnapshot = new Prisma.Decimal(price.amount);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const locked = await lockEventRow(tx, eventId);
        if (!locked) {
          throw new NotFoundException('Event not found');
        }

        const used = await sumActiveReservations(tx, eventId);
        const decision = decideCapacityOutcome(
          locked.capacity,
          used,
          input.peopleCount,
        );

        if (decision.kind === 'insufficient') {
          throw new InsufficientCapacityException(
            decision.remaining,
            decision.requested,
          );
        }

        const guestCreates: Prisma.RegistrationGuestCreateWithoutRegistrationInput[] =
          [];
        for (const g of guests) {
          let linkedUser: { connect: { id: string } } | undefined;
          let firstName = g.firstName ?? 'Guest';
          let lastName = g.lastName ?? null;
          let telegramUserId: bigint | null = null;
          let telegramUsername = g.telegramUsername ?? null;

          if (g.telegramUserId) {
            telegramUserId = BigInt(g.telegramUserId);
            const linked = await tx.user.findFirst({
              where: { telegramUserId, deletedAt: null },
            });
            if (linked) {
              linkedUser = { connect: { id: linked.id } };
              firstName = g.firstName ?? linked.firstName;
              lastName = g.lastName ?? linked.lastName;
              telegramUsername =
                g.telegramUsername ?? linked.telegramUsername;
            }
          }

          guestCreates.push({
            firstName,
            lastName,
            telegramUserId,
            telegramUsername,
            linkedUser,
          });
        }

        if (decision.kind === 'waitlist') {
          const positionAgg = await tx.waitlistEntry.aggregate({
            where: { eventId, status: WaitlistStatus.JOINED },
            _max: { position: true },
          });
          const position = (positionAgg._max.position ?? 0) + 1;

          const reg = await tx.eventRegistration.create({
            data: {
              eventId,
              primaryUserId: user.id,
              peopleCount: input.peopleCount,
              status: RegistrationStatus.WAITLISTED,
              priceSnapshot,
              currency: price.currency,
              guests: { create: guestCreates },
            },
          });

          await tx.waitlistEntry.create({
            data: {
              eventId,
              userId: user.id,
              peopleCount: input.peopleCount,
              position,
              status: WaitlistStatus.JOINED,
            },
          });

          if (locked.capacity <= used) {
            await tx.event.update({
              where: { id: eventId },
              data: { status: EventStatus.FULL },
            });
          }

          return this.serializeRegistration(reg, {
            waitlistPosition: position,
          });
        }

        const status = event.approvalRequired
          ? RegistrationStatus.PENDING_APPROVAL
          : RegistrationStatus.PENDING_PAYMENT;

        const expiresAt =
          status === RegistrationStatus.PENDING_PAYMENT
            ? new Date(Date.now() + PAYMENT_TTL_MS)
            : null;

        const reg = await tx.eventRegistration.create({
          data: {
            eventId,
            primaryUserId: user.id,
            peopleCount: input.peopleCount,
            status,
            priceSnapshot,
            currency: price.currency,
            expiresAt,
            guests: { create: guestCreates },
          },
        });

        if (status === RegistrationStatus.PENDING_PAYMENT) {
          await tx.capacityReservation.create({
            data: {
              eventId,
              registrationId: reg.id,
              peopleCount: input.peopleCount,
              status: CapacityReservationStatus.ACTIVE,
            },
          });

          const newUsed = used + input.peopleCount;
          if (newUsed >= locked.capacity) {
            await tx.event.update({
              where: { id: eventId },
              data: { status: EventStatus.FULL },
            });
          }
        }

        return this.serializeRegistration(reg);
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new DuplicateRegistrationException();
      }
      throw err;
    }
  }

  async approve(user: AuthUser, registrationId: string) {
    const reg = await this.prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });
    if (!reg) throw new NotFoundException('Registration not found');
    if (!canManageEvent(user, reg.event.organizerId)) {
      throw new ForbiddenException('Not allowed to approve this registration');
    }
    if (reg.status !== RegistrationStatus.PENDING_APPROVAL) {
      throw new UnprocessableEntityException(
        'Registration is not pending approval',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const locked = await lockEventRow(tx, reg.eventId);
      if (!locked) throw new NotFoundException('Event not found');

      const used = await sumActiveReservations(tx, reg.eventId);
      const decision = decideCapacityOutcome(
        locked.capacity,
        used,
        reg.peopleCount,
      );

      const decidedAt = new Date();

      if (decision.kind === 'ok') {
        const expiresAt = new Date(Date.now() + PAYMENT_TTL_MS);
        const updated = await tx.eventRegistration.update({
          where: { id: registrationId },
          data: {
            status: RegistrationStatus.PENDING_PAYMENT,
            approvalDecidedByUserId: user.id,
            approvalDecidedAt: decidedAt,
            expiresAt,
          },
        });
        await tx.capacityReservation.create({
          data: {
            eventId: reg.eventId,
            registrationId: reg.id,
            peopleCount: reg.peopleCount,
            status: CapacityReservationStatus.ACTIVE,
          },
        });
        const newUsed = used + reg.peopleCount;
        if (newUsed >= locked.capacity) {
          await tx.event.update({
            where: { id: reg.eventId },
            data: { status: EventStatus.FULL },
          });
        }
        return {
          reg: updated,
          waitlistPosition: undefined as number | undefined,
        };
      }

      const positionAgg = await tx.waitlistEntry.aggregate({
        where: {
          eventId: reg.eventId,
          status: WaitlistStatus.JOINED,
        },
        _max: { position: true },
      });
      const position = (positionAgg._max.position ?? 0) + 1;

      const updated = await tx.eventRegistration.update({
        where: { id: registrationId },
        data: {
          status: RegistrationStatus.WAITLISTED,
          approvalDecidedByUserId: user.id,
          approvalDecidedAt: decidedAt,
        },
      });
      await tx.waitlistEntry.create({
        data: {
          eventId: reg.eventId,
          userId: reg.primaryUserId,
          peopleCount: reg.peopleCount,
          position,
          status: WaitlistStatus.JOINED,
        },
      });
      if (locked.capacity <= used) {
        await tx.event.update({
          where: { id: reg.eventId },
          data: { status: EventStatus.FULL },
        });
      }
      return { reg: updated, waitlistPosition: position };
    });

    await this.notifications.enqueue({
      recipientUserId: reg.primaryUserId,
      type: 'registration.approved',
      entityType: 'EventRegistration',
      entityId: registrationId,
      dedupeKey: `registration:${registrationId}:approved`,
    });

    return this.serializeRegistration(result.reg, {
      waitlistPosition: result.waitlistPosition,
    });
  }

  async reject(user: AuthUser, registrationId: string, reason?: string) {
    const reg = await this.prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });
    if (!reg) throw new NotFoundException('Registration not found');
    if (!canManageEvent(user, reg.event.organizerId)) {
      throw new ForbiddenException('Not allowed to reject this registration');
    }
    if (reg.status !== RegistrationStatus.PENDING_APPROVAL) {
      throw new UnprocessableEntityException(
        'Registration is not pending approval',
      );
    }

    const updated = await this.prisma.eventRegistration.update({
      where: { id: registrationId },
      data: {
        status: RegistrationStatus.REJECTED,
        approvalDecidedByUserId: user.id,
        approvalDecidedAt: new Date(),
      },
    });

    await this.notifications.enqueue({
      recipientUserId: reg.primaryUserId,
      type: 'registration.rejected',
      entityType: 'EventRegistration',
      entityId: registrationId,
      dedupeKey: `registration:${registrationId}:rejected`,
    });

    return this.serializeRegistration(updated, {
      rejectionReason: reason ?? null,
    });
  }

  async requestCapacityOverride(
    user: AuthUser,
    registrationId: string,
    input: { requestedExtraPeople: number },
  ) {
    if (input.requestedExtraPeople < 1) {
      throw new UnprocessableEntityException(
        'requestedExtraPeople must be >= 1',
      );
    }

    const reg = await this.prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });
    if (!reg) throw new NotFoundException('Registration not found');
    if (reg.primaryUserId !== user.id) {
      throw new ForbiddenException('Only the registration owner can request');
    }
    const overrideEligible: RegistrationStatus[] = [
      RegistrationStatus.PENDING_PAYMENT,
      RegistrationStatus.APPROVED,
      RegistrationStatus.CONFIRMED,
      RegistrationStatus.PENDING_APPROVAL,
    ];
    if (!overrideEligible.includes(reg.status)) {
      throw new UnprocessableEntityException(
        'Registration is not eligible for capacity override',
      );
    }

    const req = await this.prisma.capacityOverrideRequest.create({
      data: {
        registrationId,
        requestedExtraPeople: input.requestedExtraPeople,
        status: CapacityOverrideStatus.PENDING,
      },
    });

    return { id: req.id, status: req.status };
  }

  async approveCapacityOverride(user: AuthUser, requestId: string) {
    const request = await this.prisma.capacityOverrideRequest.findUnique({
      where: { id: requestId },
      include: {
        registration: {
          include: { event: true, capacityReservation: true },
        },
      },
    });
    if (!request) throw new NotFoundException('Capacity request not found');
    if (request.status !== CapacityOverrideStatus.PENDING) {
      throw new UnprocessableEntityException('Capacity request is not pending');
    }

    const event = request.registration.event;
    if (!canManageEvent(user, event.organizerId)) {
      throw new ForbiddenException('Not allowed to approve capacity override');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await lockEventRow(tx, event.id);

      const reg = request.registration;
      const extra = request.requestedExtraPeople;
      const newPeople = reg.peopleCount + extra;

      await tx.eventRegistration.update({
        where: { id: reg.id },
        data: { peopleCount: newPeople },
      });

      if (reg.capacityReservation) {
        if (
          reg.capacityReservation.status === CapacityReservationStatus.ACTIVE
        ) {
          await tx.capacityReservation.update({
            where: { id: reg.capacityReservation.id },
            data: { peopleCount: newPeople },
          });
        }
      } else if (
        reg.status === RegistrationStatus.PENDING_PAYMENT ||
        reg.status === RegistrationStatus.APPROVED ||
        reg.status === RegistrationStatus.CONFIRMED
      ) {
        await tx.capacityReservation.create({
          data: {
            eventId: event.id,
            registrationId: reg.id,
            peopleCount: newPeople,
            status: CapacityReservationStatus.ACTIVE,
          },
        });
      }

      return tx.capacityOverrideRequest.update({
        where: { id: requestId },
        data: {
          status: CapacityOverrideStatus.APPROVED,
          decidedByUserId: user.id,
          decidedAt: new Date(),
        },
      });
    });

    return { id: updated.id, status: updated.status };
  }

  async cancel(user: AuthUser, registrationId: string) {
    const reg = await this.prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: {
        event: true,
        capacityReservation: true,
      },
    });
    if (!reg) throw new NotFoundException('Registration not found');

    const isOwner = reg.primaryUserId === user.id;
    const isManager = canManageEvent(user, reg.event.organizerId);
    if (!isOwner && !isManager) {
      throw new ForbiddenException('Not allowed to cancel this registration');
    }

    if (reg.status === RegistrationStatus.CANCELLED) {
      return this.serializeRegistration(reg);
    }

    const ownerCancellable: RegistrationStatus[] = [
      RegistrationStatus.PENDING_APPROVAL,
      RegistrationStatus.PENDING_PAYMENT,
      RegistrationStatus.APPROVED,
      RegistrationStatus.WAITLISTED,
    ];
    if (isOwner && !isManager && !ownerCancellable.includes(reg.status)) {
      throw new UnprocessableEntityException(
        'Owners may only cancel pre-payment registrations',
      );
    }

    const hadActiveReservation =
      reg.capacityReservation?.status === CapacityReservationStatus.ACTIVE;

    const updated = await this.prisma.$transaction(async (tx) => {
      await lockEventRow(tx, reg.eventId);

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

      if (reg.status === RegistrationStatus.WAITLISTED) {
        await tx.waitlistEntry.updateMany({
          where: {
            eventId: reg.eventId,
            userId: reg.primaryUserId,
            status: {
              in: [WaitlistStatus.JOINED, WaitlistStatus.OFFERED],
            },
          },
          data: { status: WaitlistStatus.LEFT },
        });
      }

      const next = await tx.eventRegistration.update({
        where: { id: registrationId },
        data: { status: RegistrationStatus.CANCELLED },
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

      return next;
    });

    if (hadActiveReservation) {
      await this.waitlist.onCapacityFreed(reg.eventId);
    }

    return this.serializeRegistration(updated);
  }
}
