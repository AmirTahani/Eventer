import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@eventer/db';
import { decodeCursor, encodeCursor } from '../common/cursor';
import { AuthUser } from '../auth/policies';

@Injectable()
export class DjsService {
  constructor(private readonly prisma: PrismaService) {}

  serialize(dj: {
    id: string;
    name: string;
    photoKey: string | null;
    instagram: string | null;
    telegramUsername: string | null;
    genre: string | null;
    bio: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: dj.id,
      name: dj.name,
      photoKey: dj.photoKey,
      instagram: dj.instagram,
      telegramUsername: dj.telegramUsername,
      genre: dj.genre,
      bio: dj.bio,
      createdAt: dj.createdAt.toISOString(),
      updatedAt: dj.updatedAt.toISOString(),
    };
  }

  async create(
    actor: AuthUser,
    input: {
      name: string;
      photoKey?: string;
      instagram?: string;
      telegramUsername?: string;
      genre?: string;
      bio?: string;
    },
  ) {
    const dj = await this.prisma.dJ.create({
      data: {
        name: input.name,
        photoKey: input.photoKey,
        instagram: input.instagram,
        telegramUsername: input.telegramUsername,
        genre: input.genre,
        bio: input.bio,
        createdByUserId: actor.id,
      },
    });
    return this.serialize(dj);
  }

  async list(query: { cursor?: string; limit?: number }) {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const cursor = decodeCursor(query.cursor);

    const items = await this.prisma.dJ.findMany({
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
      items: page.map((d) => this.serialize(d)),
      nextCursor: hasMore ? encodeCursor({ id: page[page.length - 1]!.id }) : null,
    };
  }

  async get(id: string) {
    const dj = await this.prisma.dJ.findFirst({
      where: { id, deletedAt: null },
    });
    if (!dj) throw new NotFoundException('DJ not found');
    return this.serialize(dj);
  }

  async update(
    id: string,
    input: Partial<{
      name: string;
      photoKey: string | null;
      instagram: string | null;
      telegramUsername: string | null;
      genre: string | null;
      bio: string | null;
    }>,
  ) {
    await this.get(id);
    const dj = await this.prisma.dJ.update({
      where: { id },
      data: input,
    });
    return this.serialize(dj);
  }

  async softDelete(id: string) {
    await this.get(id);
    await this.prisma.dJ.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { id, deleted: true };
  }

  async assertActiveIds(ids: string[]) {
    if (!ids.length) return;
    const found = await this.prisma.dJ.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: { id: true },
    });
    if (found.length !== ids.length) {
      throw new NotFoundException('One or more DJs not found');
    }
  }
}
