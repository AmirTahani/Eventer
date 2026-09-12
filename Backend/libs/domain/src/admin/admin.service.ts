import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@eventer/db';
import { decodeCursor, encodeCursor } from '../common/cursor';
import { moneyString } from '../common/money';

type PageQuery = { cursor?: string; limit?: number };

function pageLimit(query: PageQuery) {
  return Math.min(Math.max(query.limit ?? 50, 1), 100);
}

function userBrief(user: {
  id: string;
  telegramUserId: bigint;
  telegramUsername: string | null;
  firstName: string;
  lastName?: string | null;
  status: string;
  roles?: Array<{ role: string }>;
}) {
  return {
    id: user.id,
    telegramUserId: user.telegramUserId.toString(),
    telegramUsername: user.telegramUsername,
    firstName: user.firstName,
    lastName: user.lastName ?? null,
    status: user.status,
    roles: user.roles?.map((r) => r.role) ?? undefined,
  };
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [
      users,
      organizers,
      admins,
      events,
      openEvents,
      registrations,
      payments,
      succeededPayments,
      tickets,
      checkIns,
      invitations,
      waitlist,
      auditLogs,
      notifications,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.userRole.count({ where: { role: 'ORGANIZER' } }),
      this.prisma.userRole.count({ where: { role: 'ADMIN' } }),
      this.prisma.event.count({ where: { deletedAt: null } }),
      this.prisma.event.count({
        where: { deletedAt: null, status: { in: ['OPEN', 'FULL'] } },
      }),
      this.prisma.eventRegistration.count(),
      this.prisma.payment.count(),
      this.prisma.payment.count({ where: { status: 'SUCCEEDED' } }),
      this.prisma.ticket.count(),
      this.prisma.checkIn.count(),
      this.prisma.invitation.count(),
      this.prisma.waitlistEntry.count(),
      this.prisma.auditLog.count(),
      this.prisma.notification.count(),
    ]);

    const paymentSum = await this.prisma.payment.aggregate({
      where: { status: 'SUCCEEDED' },
      _sum: { amount: true },
    });

    return {
      users,
      organizers,
      admins,
      events,
      openEvents,
      registrations,
      payments,
      succeededPayments,
      succeededPaymentAmount: moneyString(paymentSum._sum.amount ?? 0),
      tickets,
      checkIns,
      invitations,
      waitlist,
      auditLogs,
      notifications,
    };
  }

  async listUsers(query: {
    q?: string;
    status?: string;
    role?: string;
    cursor?: string;
    limit?: number;
  }) {
    const limit = pageLimit(query);
    const cursor = decodeCursor(query.cursor);
    const where: Prisma.UserWhereInput = { deletedAt: null };

    if (query.status) {
      where.status = query.status as Prisma.EnumUserStatusFilter['equals'];
    }
    if (query.role) {
      where.roles = { some: { role: query.role as never } };
    }
    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { telegramUsername: { contains: q, mode: 'insensitive' } },
        { id: q },
      ];
      if (/^\d+$/.test(q)) {
        where.OR.push({ telegramUserId: BigInt(q) });
      }
    }

    const rows = await this.prisma.user.findMany({
      where,
      include: {
        roles: true,
        _count: {
          select: {
            eventsOrganized: true,
            registrations: true,
            invitationsSent: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor.id },
            skip: 1,
          }
        : {}),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return {
      items: page.map((u) => ({
        ...userBrief(u),
        locale: u.locale,
        invitedAt: u.invitedAt?.toISOString() ?? null,
        approvedAt: u.approvedAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        roles: u.roles.map((r) => ({
          role: r.role,
          grantedAt: r.grantedAt.toISOString(),
          grantedByUserId: r.grantedByUserId,
        })),
        counts: {
          eventsOrganized: u._count.eventsOrganized,
          registrations: u._count.registrations,
          invitationsSent: u._count.invitationsSent,
        },
      })),
      nextCursor: hasMore
        ? encodeCursor({ id: page[page.length - 1].id })
        : null,
    };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        roles: true,
        vouchedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            telegramUsername: true,
            telegramUserId: true,
            status: true,
          },
        },
        eventsOrganized: {
          where: { deletedAt: null },
          orderBy: { startAt: 'desc' },
          take: 50,
          select: {
            id: true,
            name: true,
            status: true,
            startAt: true,
            capacity: true,
            price: true,
            currency: true,
          },
        },
        registrations: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            event: { select: { id: true, name: true, status: true } },
            payments: true,
            tickets: true,
          },
        },
        invitationsSent: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        invitationsAccepted: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        waitlistEntries: {
          orderBy: { createdAt: 'desc' },
          take: 30,
          include: { event: { select: { id: true, name: true } } },
        },
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
      },
    });
    if (!user) return null;

    return {
      ...userBrief(user),
      locale: user.locale,
      invitedAt: user.invitedAt?.toISOString() ?? null,
      approvedAt: user.approvedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      deletedAt: user.deletedAt?.toISOString() ?? null,
      roles: user.roles.map((r) => ({
        role: r.role,
        grantedAt: r.grantedAt.toISOString(),
        grantedByUserId: r.grantedByUserId,
      })),
      vouchedBy: user.vouchedByUser
        ? userBrief(user.vouchedByUser)
        : null,
      eventsOrganized: user.eventsOrganized.map((e) => ({
        id: e.id,
        name: e.name,
        status: e.status,
        startAt: e.startAt.toISOString(),
        capacity: e.capacity,
        price: moneyString(e.price),
        currency: e.currency,
      })),
      registrations: user.registrations.map((r) => ({
        id: r.id,
        status: r.status,
        peopleCount: r.peopleCount,
        priceSnapshot: moneyString(r.priceSnapshot),
        currency: r.currency,
        createdAt: r.createdAt.toISOString(),
        event: r.event,
        payments: r.payments.map((p) => this.serializePayment(p)),
        tickets: r.tickets.map((t) => this.serializeTicket(t)),
      })),
      invitationsSent: user.invitationsSent.map((i) => ({
        id: i.id,
        status: i.status,
        token: i.token,
        invitedTelegramUserId: i.invitedTelegramUserId?.toString() ?? null,
        invitedTelegramUsername: i.invitedTelegramUsername,
        createdAt: i.createdAt.toISOString(),
        acceptedAt: i.acceptedAt?.toISOString() ?? null,
        acceptedUserId: i.acceptedUserId,
      })),
      invitationsAccepted: user.invitationsAccepted.map((i) => ({
        id: i.id,
        status: i.status,
        voucherUserId: i.voucherUserId,
        createdAt: i.createdAt.toISOString(),
        acceptedAt: i.acceptedAt?.toISOString() ?? null,
      })),
      waitlistEntries: user.waitlistEntries.map((w) => ({
        id: w.id,
        status: w.status,
        peopleCount: w.peopleCount,
        position: w.position,
        event: w.event,
        createdAt: w.createdAt.toISOString(),
      })),
      notifications: user.notifications.map((n) => ({
        id: n.id,
        type: n.type,
        channel: n.channel,
        status: n.status,
        entityType: n.entityType,
        entityId: n.entityId,
        attempts: n.attempts,
        error: n.error,
        createdAt: n.createdAt.toISOString(),
        sentAt: n.sentAt?.toISOString() ?? null,
      })),
      auditLogs: user.auditLogs.map((a) => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        source: a.source,
        createdAt: a.createdAt.toISOString(),
      })),
    };
  }

  async listEvents(query: {
    q?: string;
    status?: string;
    cursor?: string;
    limit?: number;
  }) {
    const limit = pageLimit(query);
    const cursor = decodeCursor(query.cursor);
    const where: Prisma.EventWhereInput = { deletedAt: null };

    if (query.status) {
      where.status = query.status as Prisma.EnumEventStatusFilter['equals'];
    }
    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { id: q },
        {
          organizer: {
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { telegramUsername: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const rows = await this.prisma.event.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            telegramUsername: true,
            telegramUserId: true,
            status: true,
          },
        },
        location: {
          select: { id: true, venueName: true, address: true },
        },
        _count: {
          select: {
            registrations: true,
            waitlistEntries: true,
            checkIns: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor.id },
            skip: 1,
          }
        : {}),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return {
      items: page.map((e) => ({
        id: e.id,
        name: e.name,
        status: e.status,
        visibilityMode: e.visibilityMode,
        startAt: e.startAt.toISOString(),
        endAt: e.endAt.toISOString(),
        capacity: e.capacity,
        price: moneyString(e.price),
        currency: e.currency,
        approvalRequired: e.approvalRequired,
        locationReleasedAt: e.locationReleasedAt?.toISOString() ?? null,
        createdAt: e.createdAt.toISOString(),
        organizer: userBrief(e.organizer),
        location: e.location,
        counts: e._count,
      })),
      nextCursor: hasMore
        ? encodeCursor({ id: page[page.length - 1].id })
        : null,
    };
  }

  async getEvent(id: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, deletedAt: null },
      include: {
        organizer: {
          include: { roles: true },
        },
        location: true,
        eventDJs: { include: { dj: true }, orderBy: { setOrder: 'asc' } },
        pricingTiers: { orderBy: { sortOrder: 'asc' } },
        accessGrants: true,
        registrations: {
          orderBy: { createdAt: 'desc' },
          include: {
            primaryUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                telegramUsername: true,
                telegramUserId: true,
                status: true,
              },
            },
            guests: true,
            payments: true,
            tickets: { include: { checkIns: true } },
            capacityReservation: true,
          },
        },
        waitlistEntries: {
          orderBy: [{ status: 'asc' }, { position: 'asc' }],
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                telegramUsername: true,
                telegramUserId: true,
                status: true,
              },
            },
          },
        },
        checkIns: {
          orderBy: { checkedInAt: 'desc' },
          include: {
            ticket: true,
            checkedInByUser: {
              select: {
                id: true,
                firstName: true,
                telegramUsername: true,
                telegramUserId: true,
                status: true,
              },
            },
          },
        },
      },
    });
    if (!event) return null;

    return {
      id: event.id,
      name: event.name,
      description: event.description,
      coverImageKey: event.coverImageKey,
      category: event.category,
      dressCode: event.dressCode,
      ageRestriction: event.ageRestriction,
      minAge: event.minAge,
      rules: event.rules,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt.toISOString(),
      capacity: event.capacity,
      price: moneyString(event.price),
      currency: event.currency,
      maxPeoplePerRegistration: event.maxPeoplePerRegistration,
      approvalRequired: event.approvalRequired,
      status: event.status,
      visibilityMode: event.visibilityMode,
      locationReleasedAt: event.locationReleasedAt?.toISOString() ?? null,
      notifyOnEditDefault: event.notifyOnEditDefault,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      organizer: {
        ...userBrief(event.organizer),
        roles: event.organizer.roles.map((r) => r.role),
      },
      location: event.location
        ? {
            id: event.location.id,
            venueName: event.location.venueName,
            address: event.location.address,
            googleMapsUrl: event.location.googleMapsUrl,
            latitude: event.location.latitude,
            longitude: event.location.longitude,
            metadata: event.location.metadata,
          }
        : null,
      djs: event.eventDJs.map((row) => ({
        setOrder: row.setOrder,
        dj: {
          id: row.dj.id,
          name: row.dj.name,
          genre: row.dj.genre,
          instagram: row.dj.instagram,
          telegramUsername: row.dj.telegramUsername,
        },
      })),
      pricingTiers: event.pricingTiers.map((t) => ({
        id: t.id,
        name: t.name,
        price: moneyString(t.price),
        currency: t.currency,
        startsAt: t.startsAt.toISOString(),
        sortOrder: t.sortOrder,
      })),
      accessGrants: event.accessGrants.map((g) => ({
        id: g.id,
        grantType: g.grantType,
        subjectUserId: g.subjectUserId,
        grantedByUserId: g.grantedByUserId,
        createdAt: g.createdAt.toISOString(),
      })),
      registrations: event.registrations.map((r) => ({
        id: r.id,
        status: r.status,
        peopleCount: r.peopleCount,
        priceSnapshot: moneyString(r.priceSnapshot),
        currency: r.currency,
        expiresAt: r.expiresAt?.toISOString() ?? null,
        approvalDecidedByUserId: r.approvalDecidedByUserId,
        approvalDecidedAt: r.approvalDecidedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        primaryUser: userBrief(r.primaryUser),
        guests: r.guests.map((g) => ({
          id: g.id,
          firstName: g.firstName,
          lastName: g.lastName,
          telegramUserId: g.telegramUserId?.toString() ?? null,
          telegramUsername: g.telegramUsername,
          linkedUserId: g.linkedUserId,
        })),
        payments: r.payments.map((p) => this.serializePayment(p)),
        tickets: r.tickets.map((t) => ({
          ...this.serializeTicket(t),
          checkIns: t.checkIns.map((c) => ({
            id: c.id,
            method: c.method,
            checkedInAt: c.checkedInAt.toISOString(),
            checkedInByUserId: c.checkedInByUserId,
          })),
        })),
        capacityReservation: r.capacityReservation
          ? {
              id: r.capacityReservation.id,
              peopleCount: r.capacityReservation.peopleCount,
              status: r.capacityReservation.status,
              createdAt: r.capacityReservation.createdAt.toISOString(),
              releasedAt:
                r.capacityReservation.releasedAt?.toISOString() ?? null,
            }
          : null,
      })),
      waitlistEntries: event.waitlistEntries.map((w) => ({
        id: w.id,
        status: w.status,
        peopleCount: w.peopleCount,
        position: w.position,
        offerExpiresAt: w.offerExpiresAt?.toISOString() ?? null,
        createdAt: w.createdAt.toISOString(),
        user: userBrief(w.user),
      })),
      checkIns: event.checkIns.map((c) => ({
        id: c.id,
        method: c.method,
        checkedInAt: c.checkedInAt.toISOString(),
        ticketId: c.ticketId,
        ticketStatus: c.ticket.status,
        checkedInBy: userBrief(c.checkedInByUser),
      })),
    };
  }

  async listPayments(query: {
    status?: string;
    cursor?: string;
    limit?: number;
  }) {
    const limit = pageLimit(query);
    const cursor = decodeCursor(query.cursor);
    const where: Prisma.PaymentWhereInput = {};
    if (query.status) {
      where.status = query.status as Prisma.EnumPaymentStatusFilter['equals'];
    }

    const rows = await this.prisma.payment.findMany({
      where,
      include: {
        registration: {
          include: {
            event: { select: { id: true, name: true, status: true } },
            primaryUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                telegramUsername: true,
                telegramUserId: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor.id },
            skip: 1,
          }
        : {}),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return {
      items: page.map((p) => ({
        ...this.serializePayment(p),
        registration: {
          id: p.registration.id,
          status: p.registration.status,
          peopleCount: p.registration.peopleCount,
          event: p.registration.event,
          primaryUser: userBrief(p.registration.primaryUser),
        },
      })),
      nextCursor: hasMore
        ? encodeCursor({ id: page[page.length - 1].id })
        : null,
    };
  }

  async listRegistrations(query: {
    status?: string;
    cursor?: string;
    limit?: number;
  }) {
    const limit = pageLimit(query);
    const cursor = decodeCursor(query.cursor);
    const where: Prisma.EventRegistrationWhereInput = {};
    if (query.status) {
      where.status =
        query.status as Prisma.EnumRegistrationStatusFilter['equals'];
    }

    const rows = await this.prisma.eventRegistration.findMany({
      where,
      include: {
        event: { select: { id: true, name: true, status: true } },
        primaryUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            telegramUsername: true,
            telegramUserId: true,
            status: true,
          },
        },
        payments: true,
        tickets: true,
        _count: { select: { guests: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor.id },
            skip: 1,
          }
        : {}),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return {
      items: page.map((r) => ({
        id: r.id,
        status: r.status,
        peopleCount: r.peopleCount,
        priceSnapshot: moneyString(r.priceSnapshot),
        currency: r.currency,
        createdAt: r.createdAt.toISOString(),
        expiresAt: r.expiresAt?.toISOString() ?? null,
        event: r.event,
        primaryUser: userBrief(r.primaryUser),
        guestCount: r._count.guests,
        payments: r.payments.map((p) => this.serializePayment(p)),
        tickets: r.tickets.map((t) => this.serializeTicket(t)),
      })),
      nextCursor: hasMore
        ? encodeCursor({ id: page[page.length - 1].id })
        : null,
    };
  }

  async listTickets(query: {
    status?: string;
    cursor?: string;
    limit?: number;
  }) {
    const limit = pageLimit(query);
    const cursor = decodeCursor(query.cursor);
    const where: Prisma.TicketWhereInput = {};
    if (query.status) {
      where.status = query.status as Prisma.EnumTicketStatusFilter['equals'];
    }

    const rows = await this.prisma.ticket.findMany({
      where,
      include: {
        registration: {
          include: {
            event: { select: { id: true, name: true, status: true } },
            primaryUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                telegramUsername: true,
                telegramUserId: true,
                status: true,
              },
            },
          },
        },
        guest: true,
        checkIns: {
          orderBy: { checkedInAt: 'desc' },
          take: 5,
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor.id },
            skip: 1,
          }
        : {}),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return {
      items: page.map((t) => ({
        ...this.serializeTicket(t),
        guest: t.guest
          ? {
              id: t.guest.id,
              firstName: t.guest.firstName,
              lastName: t.guest.lastName,
              telegramUsername: t.guest.telegramUsername,
            }
          : null,
        registration: {
          id: t.registration.id,
          status: t.registration.status,
          event: t.registration.event,
          primaryUser: userBrief(t.registration.primaryUser),
        },
        checkIns: t.checkIns.map((c) => ({
          id: c.id,
          method: c.method,
          checkedInAt: c.checkedInAt.toISOString(),
        })),
      })),
      nextCursor: hasMore
        ? encodeCursor({ id: page[page.length - 1].id })
        : null,
    };
  }

  async listAuditLogs(query: {
    entityType?: string;
    entityId?: string;
    cursor?: string;
    limit?: number;
  }) {
    const limit = pageLimit(query);
    const cursor = decodeCursor(query.cursor);
    const where: Prisma.AuditLogWhereInput = {};
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;

    const rows = await this.prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            telegramUsername: true,
            telegramUserId: true,
            status: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor.id },
            skip: 1,
          }
        : {}),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return {
      items: page.map((a) => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        beforeState: a.beforeState,
        afterState: a.afterState,
        source: a.source,
        ipAddress: a.ipAddress,
        createdAt: a.createdAt.toISOString(),
        actor: a.actor ? userBrief(a.actor) : null,
      })),
      nextCursor: hasMore
        ? encodeCursor({ id: page[page.length - 1].id })
        : null,
    };
  }

  private serializePayment(p: {
    id: string;
    registrationId: string;
    amount: Prisma.Decimal;
    currency: string;
    provider: string;
    providerTransactionId: string | null;
    status: string;
    attemptNumber: number;
    rawProviderPayload: Prisma.JsonValue | null;
    createdAt: Date;
    paidAt: Date | null;
    failedAt: Date | null;
    refundStatus: string;
    refundAmount: Prisma.Decimal | null;
  }) {
    return {
      id: p.id,
      registrationId: p.registrationId,
      amount: moneyString(p.amount),
      currency: p.currency,
      provider: p.provider,
      providerTransactionId: p.providerTransactionId,
      status: p.status,
      attemptNumber: p.attemptNumber,
      rawProviderPayload: p.rawProviderPayload,
      createdAt: p.createdAt.toISOString(),
      paidAt: p.paidAt?.toISOString() ?? null,
      failedAt: p.failedAt?.toISOString() ?? null,
      refundStatus: p.refundStatus,
      refundAmount:
        p.refundAmount != null ? moneyString(p.refundAmount) : null,
    };
  }

  private serializeTicket(t: {
    id: string;
    registrationId: string;
    holderType: string;
    guestId: string | null;
    qrToken: string;
    status: string;
    createdAt: Date;
  }) {
    return {
      id: t.id,
      registrationId: t.registrationId,
      holderType: t.holderType,
      guestId: t.guestId,
      qrToken: t.qrToken,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    };
  }
}
