import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@eventer/db';
import { decodeCursor, encodeCursor } from '../common/cursor';
import { AuthUser } from '../auth/policies';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  serialize(loc: {
    id: string;
    venueName: string;
    address: string;
    googleMapsUrl: string | null;
    latitude: number | null;
    longitude: number | null;
    metadata: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: loc.id,
      venueName: loc.venueName,
      address: loc.address,
      googleMapsUrl: loc.googleMapsUrl,
      latitude: loc.latitude,
      longitude: loc.longitude,
      metadata: loc.metadata,
      createdAt: loc.createdAt.toISOString(),
      updatedAt: loc.updatedAt.toISOString(),
    };
  }

  serializePublic(loc: {
    venueName: string;
    address: string;
    googleMapsUrl: string | null;
    latitude: number | null;
    longitude: number | null;
  }) {
    return {
      venueName: loc.venueName,
      address: loc.address,
      googleMapsUrl: loc.googleMapsUrl,
      latitude: loc.latitude,
      longitude: loc.longitude,
    };
  }

  async create(
    actor: AuthUser,
    input: {
      venueName: string;
      address: string;
      googleMapsUrl?: string;
      latitude?: number;
      longitude?: number;
      metadata?: Record<string, unknown>;
    },
  ) {
    const loc = await this.prisma.location.create({
      data: {
        venueName: input.venueName,
        address: input.address,
        googleMapsUrl: input.googleMapsUrl,
        latitude: input.latitude,
        longitude: input.longitude,
        metadata: (input.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        createdByUserId: actor.id,
      },
    });
    return this.serialize(loc);
  }

  async list(query: { cursor?: string; limit?: number }) {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const cursor = decodeCursor(query.cursor);

    const items = await this.prisma.location.findMany({
      where: { deletedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
    return {
      items: page.map((l) => this.serialize(l)),
      nextCursor: hasMore
        ? encodeCursor({ id: page[page.length - 1]!.id })
        : null,
    };
  }

  async get(id: string) {
    const loc = await this.prisma.location.findFirst({
      where: { id, deletedAt: null },
    });
    if (!loc) throw new NotFoundException('Location not found');
    return this.serialize(loc);
  }

  async update(
    id: string,
    input: Partial<{
      venueName: string;
      address: string;
      googleMapsUrl: string | null;
      latitude: number | null;
      longitude: number | null;
      metadata: Record<string, unknown> | null;
    }>,
  ) {
    await this.get(id);
    const loc = await this.prisma.location.update({
      where: { id },
      data: {
        venueName: input.venueName,
        address: input.address,
        googleMapsUrl: input.googleMapsUrl,
        latitude: input.latitude,
        longitude: input.longitude,
        metadata:
          input.metadata === undefined
            ? undefined
            : input.metadata === null
              ? Prisma.JsonNull
              : (input.metadata as Prisma.InputJsonValue),
      },
    });
    return this.serialize(loc);
  }

  async softDelete(id: string) {
    await this.get(id);
    await this.prisma.location.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { id, deleted: true };
  }
}
