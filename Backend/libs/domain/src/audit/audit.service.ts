import { Injectable } from '@nestjs/common';
import { AuditSource, Prisma } from '@prisma/client';
import { PrismaService } from '@eventer/db';
import { AuthUser, isAdmin } from '../auth/policies';
import { decodeCursor, encodeCursor } from '../common/cursor';

export type AuditAppendInput = {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  source: AuditSource;
  ipAddress?: string | null;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async append(input: AuditAppendInput) {
    return this.prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        beforeState:
          input.before === undefined
            ? undefined
            : (input.before as Prisma.InputJsonValue),
        afterState:
          input.after === undefined
            ? undefined
            : (input.after as Prisma.InputJsonValue),
        source: input.source,
        ipAddress: input.ipAddress ?? null,
      },
    });
  }

  async list(
    user: AuthUser,
    query: {
      entityType?: string;
      entityId?: string;
      actorUserId?: string;
      from?: string;
      to?: string;
      cursor?: string;
      limit?: number;
    },
  ) {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const cursor = decodeCursor(query.cursor);

    const filters: Prisma.AuditLogWhereInput[] = [];

    if (query.entityType) filters.push({ entityType: query.entityType });
    if (query.entityId) filters.push({ entityId: query.entityId });
    if (query.actorUserId) filters.push({ actorUserId: query.actorUserId });
    if (query.from || query.to) {
      filters.push({
        createdAt: {
          ...(query.from ? { gte: new Date(query.from) } : {}),
          ...(query.to ? { lte: new Date(query.to) } : {}),
        },
      });
    }

    if (!isAdmin(user)) {
      // Organizer: only logs for entities belonging to their events
      const eventIds = (
        await this.prisma.event.findMany({
          where: { organizerId: user.id, deletedAt: null },
          select: { id: true },
        })
      ).map((e) => e.id);

      if (eventIds.length === 0) {
        return { items: [], nextCursor: null };
      }

      const registrationIds = (
        await this.prisma.eventRegistration.findMany({
          where: { eventId: { in: eventIds } },
          select: { id: true },
        })
      ).map((r) => r.id);

      filters.push({
        OR: [
          { entityType: 'Event', entityId: { in: eventIds } },
          {
            entityType: 'EventRegistration',
            entityId: { in: registrationIds },
          },
          { entityType: 'CheckIn', entityId: { in: eventIds } },
        ],
      });
    }

    const where: Prisma.AuditLogWhereInput =
      filters.length > 0 ? { AND: filters } : {};

    const rows = await this.prisma.auditLog.findMany({
      where,
      include: {
        actor: { select: { id: true, firstName: true } },
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
      items: page.map((row) => ({
        id: row.id,
        actor: row.actor
          ? { id: row.actor.id, firstName: row.actor.firstName }
          : null,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        beforeState: row.beforeState,
        afterState: row.afterState,
        source: row.source,
        createdAt: row.createdAt.toISOString(),
      })),
      nextCursor: hasMore
        ? encodeCursor({ id: page[page.length - 1].id })
        : null,
    };
  }
}
