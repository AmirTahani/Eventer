import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  forwardRef,
} from '@nestjs/common';
import {
  CapacityReservationStatus,
  EventAccessGrantType,
  EventStatus,
  EventVisibilityMode,
  Prisma,
  RegistrationStatus,
  AuditSource,
} from '@prisma/client';
import { PrismaService } from '@eventer/db';
import { AuthUser, canManageEvent, isAdmin } from '../auth/policies';
import { AuditService } from '../audit/audit.service';
import { decodeCursor, encodeCursor } from '../common/cursor';
import { moneyDecimal, moneyString } from '../common/money';
import { DjsService } from '../djs/djs.service';
import { FilesService } from '../files/files.service';
import { LocationsService } from '../locations/locations.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WaitlistService } from '../waitlist/waitlist.service';
import { EventVisibilityService } from './event-visibility.service';
import {
  resolveActivePrice,
  resolvePriceIncreaseHint,
  validatePricingTiersInput,
} from './pricing-resolver';

const eventDetailIncludeBase = {
  eventDJs: {
    include: {
      dj: true,
    },
    orderBy: { setOrder: 'asc' as const },
  },
  pricingTiers: { orderBy: { startsAt: 'asc' as const } },
  accessGrants: true,
} satisfies Prisma.EventInclude;

/** Include location only when the requester is authorized (§3.7 query-level). */
function eventDetailInclude(withLocation: boolean) {
  return {
    ...eventDetailIncludeBase,
    location: withLocation,
  } satisfies Prisma.EventInclude;
}

type EventDetail = Prisma.EventGetPayload<{
  include: ReturnType<typeof eventDetailInclude>;
}>;

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: EventVisibilityService,
    private readonly djs: DjsService,
    private readonly locations: LocationsService,
    private readonly files: FilesService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
    @Inject(forwardRef(() => WaitlistService))
    private readonly waitlist: WaitlistService,
  ) {}

  private assertCanManage(user: AuthUser, organizerId: string) {
    if (!canManageEvent(user, organizerId)) {
      throw new ForbiddenException('Not allowed to manage this event');
    }
  }

  async remainingCapacity(eventId: string, capacity: number): Promise<number> {
    const used = await this.prisma.capacityReservation.aggregate({
      where: { eventId, status: CapacityReservationStatus.ACTIVE },
      _sum: { peopleCount: true },
    });
    return Math.max(0, capacity - (used._sum.peopleCount ?? 0));
  }

  async confirmedAndPendingCount(eventId: string): Promise<number> {
    const used = await this.prisma.capacityReservation.aggregate({
      where: { eventId, status: CapacityReservationStatus.ACTIVE },
      _sum: { peopleCount: true },
    });
    return used._sum.peopleCount ?? 0;
  }

  async canSeeLocation(user: AuthUser, eventId: string): Promise<boolean> {
    if (isAdmin(user)) {
      const event = await this.prisma.event.findFirst({
        where: { id: eventId, deletedAt: null },
        select: { locationReleasedAt: true, organizerId: true },
      });
      if (!event?.locationReleasedAt) return false;
      // Admin still needs release; location visibility for admin of unreleased stays null
      // Spec: confirmed registrant or guest only. Organizer/admin managing may need it —
      // overview says "confirmed people only". Keep strict: only confirmed/guest.
    }

    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: { locationReleasedAt: true },
    });
    if (!event?.locationReleasedAt) return false;

    const confirmed = await this.prisma.eventRegistration.findFirst({
      where: {
        eventId,
        status: RegistrationStatus.CONFIRMED,
        OR: [
          { primaryUserId: user.id },
          {
            guests: {
              some: { linkedUserId: user.id },
            },
          },
        ],
      },
      select: { id: true },
    });
    return !!confirmed;
  }

  private serializeDjs(
    event: EventDetail,
    detail: boolean,
  ): Array<Record<string, unknown>> {
    return event.eventDJs
      .filter((ed) => !ed.dj.deletedAt)
      .map((ed) =>
        detail
          ? {
              id: ed.dj.id,
              name: ed.dj.name,
              genre: ed.dj.genre,
              instagram: ed.dj.instagram,
            }
          : { id: ed.dj.id, name: ed.dj.name },
      );
  }

  async serializeListItem(event: EventDetail, remaining: number) {
    const price = resolveActivePrice(
      event.price,
      event.currency,
      event.pricingTiers,
    );
    return {
      id: event.id,
      name: event.name,
      coverImageUrl: this.files.publicUrlForKey(event.coverImageKey),
      startAt: event.startAt.toISOString(),
      endAt: event.endAt.toISOString(),
      status: event.status,
      currentPrice: { amount: price.amount, currency: price.currency },
      capacity: event.capacity,
      remaining,
      locationReleased: !!event.locationReleasedAt,
      djs: this.serializeDjs(event, false),
    };
  }

  async serializeDetail(
    user: AuthUser,
    event: EventDetail,
    remaining: number,
  ) {
    const price = resolveActivePrice(
      event.price,
      event.currency,
      event.pricingTiers,
    );
    const hint = resolvePriceIncreaseHint(event.pricingTiers);
    const showLocation = await this.canSeeLocation(user, event.id);

    return {
      id: event.id,
      name: event.name,
      description: event.description,
      coverImageUrl: this.files.publicUrlForKey(event.coverImageKey),
      coverImageKey: event.coverImageKey,
      category: event.category,
      dressCode: event.dressCode,
      ageRestriction: event.ageRestriction,
      minAge: event.minAge,
      rules: event.rules,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt.toISOString(),
      capacity: event.capacity,
      remaining,
      maxPeoplePerRegistration: event.maxPeoplePerRegistration,
      approvalRequired: event.approvalRequired,
      status: event.status,
      visibilityMode: event.visibilityMode,
      price: moneyString(event.price),
      currency: event.currency,
      currentPrice: { amount: price.amount, currency: price.currency },
      priceIncreaseHint: hint,
      pricingTiers: event.pricingTiers.map((t) => ({
        id: t.id,
        name: t.name,
        price: moneyString(t.price),
        currency: t.currency,
        startsAt: t.startsAt.toISOString(),
        sortOrder: t.sortOrder,
      })),
      djs: this.serializeDjs(event, true),
      location:
        showLocation && event.location && !event.location.deletedAt
          ? this.locations.serializePublic(event.location)
          : null,
      locationReleased: !!event.locationReleasedAt,
      locationReleasedAt: event.locationReleasedAt?.toISOString() ?? null,
      // Never expose locationId to attendees — only managers need it for editing.
      ...(canManageEvent(user, event.organizerId)
        ? { locationId: event.locationId }
        : {}),
      organizerId: event.organizerId,
      notifyOnEditDefault: event.notifyOnEditDefault,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }

  async create(
    actor: AuthUser,
    input: {
      name: string;
      description?: string;
      coverImageKey?: string;
      category?: string;
      dressCode?: string;
      ageRestriction?: boolean;
      minAge?: number;
      rules?: string;
      djIds?: string[];
      locationId?: string | null;
      startAt: string;
      endAt: string;
      capacity: number;
      price: string;
      currency: string;
      maxPeoplePerRegistration: number;
      approvalRequired?: boolean;
      visibilityMode?: EventVisibilityMode;
      pricingTiers?: Array<{ name?: string; price: string; startsAt: string }>;
      notifyOnEditDefault?: boolean;
    },
  ) {
    const startAt = new Date(input.startAt);
    const endAt = new Date(input.endAt);
    if (!(startAt.getTime() < endAt.getTime())) {
      throw new UnprocessableEntityException('startAt must be before endAt');
    }
    if (input.capacity < 1) {
      throw new UnprocessableEntityException('capacity must be >= 1');
    }
    if (input.maxPeoplePerRegistration < 1) {
      throw new UnprocessableEntityException(
        'maxPeoplePerRegistration must be >= 1',
      );
    }

    const tiers = (input.pricingTiers ?? []).map((t, i) => ({
      name: t.name ?? null,
      price: t.price,
      startsAt: new Date(t.startsAt),
      sortOrder: i,
    }));
    const tierErr = validatePricingTiersInput(tiers, startAt);
    if (tierErr) throw new UnprocessableEntityException(tierErr);

    if (input.djIds?.length) {
      await this.djs.assertActiveIds(input.djIds);
    }
    if (input.locationId) {
      await this.locations.get(input.locationId);
    }

    const event = await this.prisma.event.create({
      data: {
        organizerId: actor.id,
        name: input.name,
        description: input.description,
        coverImageKey: input.coverImageKey,
        category: input.category,
        dressCode: input.dressCode,
        ageRestriction: input.ageRestriction ?? false,
        minAge: input.minAge,
        rules: input.rules,
        locationId: input.locationId ?? null,
        startAt,
        endAt,
        capacity: input.capacity,
        price: moneyDecimal(input.price),
        currency: input.currency.toUpperCase().slice(0, 3),
        maxPeoplePerRegistration: input.maxPeoplePerRegistration,
        approvalRequired: input.approvalRequired ?? false,
        visibilityMode: input.visibilityMode ?? EventVisibilityMode.ALL_APPROVED,
        notifyOnEditDefault: input.notifyOnEditDefault ?? true,
        status: EventStatus.DRAFT,
        eventDJs: input.djIds?.length
          ? {
              create: input.djIds.map((djId, index) => ({
                djId,
                setOrder: index,
              })),
            }
          : undefined,
        pricingTiers: tiers.length
          ? {
              create: tiers.map((t) => ({
                name: t.name,
                price: moneyDecimal(t.price),
                currency: input.currency.toUpperCase().slice(0, 3),
                startsAt: t.startsAt,
                sortOrder: t.sortOrder,
              })),
            }
          : undefined,
      },
      include: eventDetailInclude(true),
    });

    const remaining = await this.remainingCapacity(event.id, event.capacity);
    await this.audit.append({
      actorUserId: actor.id,
      action: 'event.created',
      entityType: 'Event',
      entityId: event.id,
      before: null,
      after: { name: event.name, status: event.status },
      source: AuditSource.WEB,
    });
    return this.serializeDetail(actor, event, remaining);
  }

  async list(
    user: AuthUser,
    query: {
      status?: EventStatus;
      from?: string;
      to?: string;
      cursor?: string;
      limit?: number;
    },
  ) {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const cursor = decodeCursor(query.cursor);
    const visibilityWhere = await this.visibility.visibilityWhere(user);

    const where: Prisma.EventWhereInput = {
      AND: [
        visibilityWhere,
        query.status ? { status: query.status } : {},
        query.from ? { startAt: { gte: new Date(query.from) } } : {},
        query.to ? { startAt: { lte: new Date(query.to) } } : {},
      ],
    };

    const items = await this.prisma.event.findMany({
      where,
      include: eventDetailInclude(true),
      orderBy: [{ startAt: 'asc' }, { id: 'asc' }],
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor.id },
            skip: 1,
          }
        : {}),
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    const serialized = await Promise.all(
      page.map(async (event) => {
        const remaining = await this.remainingCapacity(event.id, event.capacity);
        return this.serializeListItem(event, remaining);
      }),
    );

    return {
      items: serialized,
      nextCursor: hasMore
        ? encodeCursor({ id: page[page.length - 1]!.id })
        : null,
    };
  }

  async getById(user: AuthUser, id: string) {
    // Visibility check first without location, then re-fetch with location only if authorized (§3.7).
    const head = await this.prisma.event.findFirst({
      where: { id, deletedAt: null },
      include: eventDetailInclude(false),
    });
    if (!head) throw new NotFoundException('Event not found');

    const allowed = await this.visibility.canSeeEvent(user, head);
    if (!allowed) throw new NotFoundException('Event not found');

    const showLocation = await this.canSeeLocation(user, id);
    const event = showLocation
      ? await this.prisma.event.findFirstOrThrow({
          where: { id, deletedAt: null },
          include: eventDetailInclude(true),
        })
      : head;

    const remaining = await this.remainingCapacity(event.id, event.capacity);
    return this.serializeDetail(user, event, remaining);
  }

  /** Load event for management without visibility 404 (still 404 if missing). */
  async requireManagedEvent(user: AuthUser, id: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, deletedAt: null },
      include: eventDetailInclude(true),
    });
    if (!event) throw new NotFoundException('Event not found');
    this.assertCanManage(user, event.organizerId);
    return event;
  }

  async update(
    user: AuthUser,
    id: string,
    input: {
      name?: string;
      description?: string | null;
      coverImageKey?: string | null;
      category?: string | null;
      dressCode?: string | null;
      ageRestriction?: boolean;
      minAge?: number | null;
      rules?: string | null;
      djIds?: string[];
      locationId?: string | null;
      startAt?: string;
      endAt?: string;
      capacity?: number;
      force?: boolean;
      price?: string;
      currency?: string;
      maxPeoplePerRegistration?: number;
      approvalRequired?: boolean;
      visibilityMode?: EventVisibilityMode;
      notifyOnEditDefault?: boolean;
    },
  ) {
    const event = await this.requireManagedEvent(user, id);

    const startAt = input.startAt ? new Date(input.startAt) : event.startAt;
    const endAt = input.endAt ? new Date(input.endAt) : event.endAt;
    if (!(startAt.getTime() < endAt.getTime())) {
      throw new UnprocessableEntityException('startAt must be before endAt');
    }

    if (input.capacity !== undefined) {
      if (input.capacity < 1) {
        throw new UnprocessableEntityException('capacity must be >= 1');
      }
      const pending = await this.confirmedAndPendingCount(id);
      if (input.capacity < pending) {
        if (!(input.force && isAdmin(user))) {
          throw new UnprocessableEntityException(
            `capacity cannot be less than confirmedAndPendingCount (${pending})`,
          );
        }
      }
    }

    if (input.djIds) {
      await this.djs.assertActiveIds(input.djIds);
    }
    if (input.locationId) {
      await this.locations.get(input.locationId);
    }

    const previousCapacity = event.capacity;
    const priceChanged =
      input.price !== undefined &&
      moneyString(event.price) !== moneyString(moneyDecimal(input.price));
    const dateChanged =
      (input.startAt !== undefined &&
        event.startAt.getTime() !== startAt.getTime()) ||
      (input.endAt !== undefined && event.endAt.getTime() !== endAt.getTime());
    const locationChanged =
      input.locationId !== undefined &&
      input.locationId !== event.locationId &&
      !!event.locationReleasedAt;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (input.djIds) {
        await tx.eventDJ.deleteMany({ where: { eventId: id } });
        if (input.djIds.length) {
          await tx.eventDJ.createMany({
            data: input.djIds.map((djId, index) => ({
              eventId: id,
              djId,
              setOrder: index,
            })),
          });
        }
      }

      return tx.event.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
          coverImageKey: input.coverImageKey,
          category: input.category,
          dressCode: input.dressCode,
          ageRestriction: input.ageRestriction,
          minAge: input.minAge,
          rules: input.rules,
          locationId: input.locationId,
          startAt: input.startAt ? startAt : undefined,
          endAt: input.endAt ? endAt : undefined,
          capacity: input.capacity,
          price: input.price !== undefined ? moneyDecimal(input.price) : undefined,
          currency: input.currency?.toUpperCase().slice(0, 3),
          maxPeoplePerRegistration: input.maxPeoplePerRegistration,
          approvalRequired: input.approvalRequired,
          visibilityMode: input.visibilityMode,
          notifyOnEditDefault: input.notifyOnEditDefault,
        },
        include: eventDetailInclude(true),
      });
    });

    // D11/D14: price/date/location-after-release always notify; cosmetics respect toggle.
    const notifyCosmetic =
      input.notifyOnEditDefault ?? event.notifyOnEditDefault;
    const mustNotify = priceChanged || dateChanged || locationChanged;
    const cosmeticChanged =
      input.description !== undefined ||
      input.dressCode !== undefined ||
      input.djIds !== undefined;
    if (mustNotify || (notifyCosmetic && cosmeticChanged)) {
      const type = priceChanged
        ? 'event.price_changed'
        : dateChanged
          ? 'event.datetime_changed'
          : locationChanged
            ? 'event.location_changed'
            : 'event.updated';
      await this.notifyNonTerminalRegistrants(id, type);
    }

    if (input.capacity !== undefined && input.capacity > previousCapacity) {
      await this.recomputeEventStatus(id);
      await this.waitlist.onCapacityFreed(id);
    } else if (input.capacity !== undefined) {
      await this.recomputeEventStatus(id);
    }

    const remaining = await this.remainingCapacity(
      updated.id,
      updated.capacity,
    );
    return this.serializeDetail(user, updated, remaining);
  }

  async replacePricingTiers(
    user: AuthUser,
    id: string,
    input: {
      tiers: Array<{ name?: string; price: string; startsAt: string }>;
      force?: boolean;
    },
  ) {
    const event = await this.requireManagedEvent(user, id);
    const tiers = input.tiers.map((t, i) => ({
      name: t.name ?? null,
      price: t.price,
      startsAt: new Date(t.startsAt),
      sortOrder: i,
    }));
    const tierErr = validatePricingTiersInput(tiers, event.startAt);
    if (tierErr) throw new UnprocessableEntityException(tierErr);

    const now = new Date();
    const startedTier = event.pricingTiers.filter(
      (t) => t.startsAt.getTime() <= now.getTime(),
    );

    if (startedTier.length && !(input.force && isAdmin(user))) {
      const hasRegs = await this.prisma.eventRegistration.count({
        where: {
          eventId: id,
          status: {
            in: [
              RegistrationStatus.PENDING_APPROVAL,
              RegistrationStatus.PENDING_PAYMENT,
              RegistrationStatus.APPROVED,
              RegistrationStatus.CONFIRMED,
              RegistrationStatus.WAITLISTED,
            ],
          },
        },
      });
      if (hasRegs > 0) {
        // Block if any existing started tier is being removed or its price/startsAt changed
        for (const existing of startedTier) {
          const replacement = tiers.find(
            (t) => t.startsAt.getTime() === existing.startsAt.getTime(),
          );
          if (
            !replacement ||
            moneyString(existing.price) !== moneyString(replacement.price)
          ) {
            throw new UnprocessableEntityException(
              'Cannot edit pricing tiers whose window has already started and have registrations (pass force=true as Admin)',
            );
          }
        }
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.pricingTier.deleteMany({ where: { eventId: id } });
      if (tiers.length) {
        await tx.pricingTier.createMany({
          data: tiers.map((t) => ({
            eventId: id,
            name: t.name,
            price: moneyDecimal(t.price),
            currency: event.currency,
            startsAt: t.startsAt,
            sortOrder: t.sortOrder,
          })),
        });
      }
      return tx.event.findFirstOrThrow({
        where: { id },
        include: eventDetailInclude(true),
      });
    });

    const remaining = await this.remainingCapacity(
      updated.id,
      updated.capacity,
    );
    return this.serializeDetail(user, updated, remaining);
  }

  async publish(user: AuthUser, id: string) {
    const event = await this.requireManagedEvent(user, id);
    if (event.status !== EventStatus.DRAFT) {
      throw new UnprocessableEntityException('Event is not in DRAFT status');
    }
    const updated = await this.prisma.event.update({
      where: { id },
      data: { status: EventStatus.OPEN },
      include: eventDetailInclude(true),
    });
    const remaining = await this.remainingCapacity(
      updated.id,
      updated.capacity,
    );
    return this.serializeDetail(user, updated, remaining);
  }

  async releaseLocation(user: AuthUser, id: string) {
    const event = await this.requireManagedEvent(user, id);
    if (event.locationReleasedAt) {
      return {
        eventId: event.id,
        locationReleasedAt: event.locationReleasedAt.toISOString(),
      };
    }
    const updated = await this.prisma.event.update({
      where: { id },
      data: { locationReleasedAt: new Date() },
    });

    const confirmed = await this.prisma.eventRegistration.findMany({
      where: { eventId: id, status: RegistrationStatus.CONFIRMED },
      select: { id: true, primaryUserId: true },
    });
    await this.notifications.enqueueMany(
      confirmed.map((r) => ({
        recipientUserId: r.primaryUserId,
        type: 'location.released',
        entityType: 'Event',
        entityId: id,
        dedupeKey: `event:${id}:location-released:user:${r.primaryUserId}`,
      })),
    );

    await this.audit.append({
      actorUserId: user.id,
      action: 'event.location_released',
      entityType: 'Event',
      entityId: id,
      before: { locationReleasedAt: null },
      after: { locationReleasedAt: updated.locationReleasedAt!.toISOString() },
      source: AuditSource.WEB,
    });

    return {
      eventId: updated.id,
      locationReleasedAt: updated.locationReleasedAt!.toISOString(),
    };
  }

  async cancel(user: AuthUser, id: string, _reason?: string) {
    const event = await this.requireManagedEvent(user, id);

    const activeStatuses: RegistrationStatus[] = [
      RegistrationStatus.PENDING_APPROVAL,
      RegistrationStatus.APPROVED,
      RegistrationStatus.PENDING_PAYMENT,
      RegistrationStatus.CONFIRMED,
      RegistrationStatus.WAITLISTED,
    ];
    const recipients = await this.prisma.eventRegistration.findMany({
      where: { eventId: id, status: { in: activeStatuses } },
      select: { primaryUserId: true },
      distinct: ['primaryUserId'],
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      const ev = await tx.event.update({
        where: { id },
        data: { status: EventStatus.CANCELLED },
        include: eventDetailInclude(true),
      });

      await tx.ticket.updateMany({
        where: {
          registration: { eventId: id },
          status: { not: 'VOID' },
        },
        data: { status: 'VOID' },
      });

      await tx.capacityReservation.updateMany({
        where: { eventId: id, status: CapacityReservationStatus.ACTIVE },
        data: {
          status: CapacityReservationStatus.RELEASED,
          releasedAt: new Date(),
        },
      });

      await tx.eventRegistration.updateMany({
        where: { eventId: id, status: { in: activeStatuses } },
        data: { status: RegistrationStatus.CANCELLED },
      });

      return ev;
    });

    await this.notifications.enqueueMany(
      recipients.map((r) => ({
        recipientUserId: r.primaryUserId,
        type: 'event.cancelled',
        entityType: 'Event',
        entityId: id,
        dedupeKey: `event:${id}:cancelled:user:${r.primaryUserId}`,
      })),
    );

    await this.audit.append({
      actorUserId: user.id,
      action: 'event.cancelled',
      entityType: 'Event',
      entityId: id,
      before: { status: event.status },
      after: { status: EventStatus.CANCELLED },
      source: AuditSource.WEB,
    });

    const remaining = await this.remainingCapacity(
      updated.id,
      updated.capacity,
    );
    return this.serializeDetail(user, updated, remaining);
  }

  async addAccessGrant(
    user: AuthUser,
    eventId: string,
    input: {
      grantType: EventAccessGrantType;
      subjectUserId: string;
    },
  ) {
    await this.requireManagedEvent(user, eventId);
    const grant = await this.prisma.eventAccessGrant.create({
      data: {
        eventId,
        grantType: input.grantType,
        subjectUserId: input.subjectUserId,
        grantedByUserId: user.id,
      },
    });
    await this.audit.append({
      actorUserId: user.id,
      action: 'event.access_grant_created',
      entityType: 'Event',
      entityId: eventId,
      before: null,
      after: {
        grantId: grant.id,
        grantType: grant.grantType,
        subjectUserId: grant.subjectUserId,
      },
      source: AuditSource.WEB,
    });
    return {
      id: grant.id,
      eventId: grant.eventId,
      grantType: grant.grantType,
      subjectUserId: grant.subjectUserId,
      createdAt: grant.createdAt.toISOString(),
    };
  }

  async listAccessGrants(user: AuthUser, eventId: string) {
    await this.requireManagedEvent(user, eventId);
    const grants = await this.prisma.eventAccessGrant.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
    });
    return {
      items: grants.map((g) => ({
        id: g.id,
        grantType: g.grantType,
        subjectUserId: g.subjectUserId,
        createdAt: g.createdAt.toISOString(),
      })),
    };
  }

  async removeAccessGrant(user: AuthUser, eventId: string, grantId: string) {
    await this.requireManagedEvent(user, eventId);
    const grant = await this.prisma.eventAccessGrant.findFirst({
      where: { id: grantId, eventId },
    });
    if (!grant) throw new NotFoundException('Access grant not found');
    await this.prisma.eventAccessGrant.delete({ where: { id: grantId } });
    return { id: grantId, deleted: true };
  }

  /** Used by registrations — throws 404 if not visible. */
  async requireVisibleEvent(user: AuthUser, id: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, deletedAt: null },
      include: eventDetailInclude(true),
    });
    if (!event) throw new NotFoundException('Event not found');
    const allowed = await this.visibility.canSeeEvent(user, event);
    if (!allowed) throw new NotFoundException('Event not found');
    return event;
  }

  async notifyNonTerminalRegistrants(eventId: string, type: string) {
    const activeStatuses: RegistrationStatus[] = [
      RegistrationStatus.PENDING_APPROVAL,
      RegistrationStatus.APPROVED,
      RegistrationStatus.PENDING_PAYMENT,
      RegistrationStatus.CONFIRMED,
      RegistrationStatus.WAITLISTED,
    ];
    const recipients = await this.prisma.eventRegistration.findMany({
      where: { eventId, status: { in: activeStatuses } },
      select: { primaryUserId: true },
      distinct: ['primaryUserId'],
    });
    await this.notifications.enqueueMany(
      recipients.map((r) => ({
        recipientUserId: r.primaryUserId,
        type,
        entityType: 'Event',
        entityId: eventId,
        dedupeKey: `event:${eventId}:${type}:user:${r.primaryUserId}:${Date.now()}`,
      })),
    );
  }

  /**
   * Recompute OPEN ↔ FULL from active reservations. Does not reopen CLOSED/CANCELLED/COMPLETED.
   */
  async recomputeEventStatus(eventId: string): Promise<EventStatus> {
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.findUniqueOrThrow({
        where: { id: eventId },
      });
      if (
        event.status === EventStatus.CANCELLED ||
        event.status === EventStatus.COMPLETED ||
        event.status === EventStatus.CLOSED ||
        event.status === EventStatus.DRAFT
      ) {
        return event.status;
      }

      const used = await tx.capacityReservation.aggregate({
        where: {
          eventId,
          status: CapacityReservationStatus.ACTIVE,
        },
        _sum: { peopleCount: true },
      });
      const reserved = used._sum.peopleCount ?? 0;
      const next =
        reserved >= event.capacity ? EventStatus.FULL : EventStatus.OPEN;
      if (next !== event.status) {
        await tx.event.update({
          where: { id: eventId },
          data: { status: next },
        });
      }
      return next;
    });
  }

  /** Organizer manually stops new registrations without cancelling. */
  async close(user: AuthUser, id: string) {
    const event = await this.requireManagedEvent(user, id);
    if (
      event.status === EventStatus.CANCELLED ||
      event.status === EventStatus.COMPLETED ||
      event.status === EventStatus.DRAFT
    ) {
      throw new UnprocessableEntityException(
        `Cannot close event in status ${event.status}`,
      );
    }
    const updated = await this.prisma.event.update({
      where: { id },
      data: { status: EventStatus.CLOSED },
      include: eventDetailInclude(true),
    });
    const remaining = await this.remainingCapacity(
      updated.id,
      updated.capacity,
    );
    return this.serializeDetail(user, updated, remaining);
  }

  /** Mark past OPEN/FULL/CLOSED events as COMPLETED (worker safety net). */
  async markCompletedEvents(): Promise<{ completed: number }> {
    const result = await this.prisma.event.updateMany({
      where: {
        deletedAt: null,
        endAt: { lte: new Date() },
        status: {
          in: [EventStatus.OPEN, EventStatus.FULL, EventStatus.CLOSED],
        },
      },
      data: { status: EventStatus.COMPLETED },
    });
    return { completed: result.count };
  }
}
