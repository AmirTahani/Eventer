import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RoleName, UserStatus } from '@prisma/client';
import { PrismaService } from '@eventer/db';
import { AuthUser } from '../auth/policies';

const userInclude = {
  roles: true,
  vouchedByUser: {
    select: { id: true, firstName: true },
  },
} satisfies Prisma.UserInclude;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  toAuthUser(
    user: Prisma.UserGetPayload<{ include: typeof userInclude }>,
  ): AuthUser {
    return {
      id: user.id,
      telegramUserId: user.telegramUserId.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      telegramUsername: user.telegramUsername,
      locale: user.locale,
      status: user.status,
      roles: user.roles.map((r) => r.role),
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: userInclude,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByTelegramUserId(telegramUserId: bigint) {
    return this.prisma.user.findFirst({
      where: { telegramUserId, deletedAt: null },
      include: userInclude,
    });
  }

  async upsertFromTelegram(input: {
    telegramUserId: bigint;
    firstName: string;
    lastName?: string;
    telegramUsername?: string;
  }) {
    const existing = await this.findByTelegramUserId(input.telegramUserId);
    if (existing) {
      return this.prisma.user.update({
        where: { id: existing.id },
        data: {
          firstName: input.firstName,
          lastName: input.lastName ?? existing.lastName,
          telegramUsername:
            input.telegramUsername ?? existing.telegramUsername,
        },
        include: userInclude,
      });
    }

    return this.prisma.user.create({
      data: {
        telegramUserId: input.telegramUserId,
        firstName: input.firstName,
        lastName: input.lastName,
        telegramUsername: input.telegramUsername,
        status: UserStatus.PENDING,
      },
      include: userInclude,
    });
  }

  async grantRole(
    userId: string,
    role: RoleName,
    grantedByUserId?: string,
  ) {
    return this.prisma.userRole.upsert({
      where: { userId_role: { userId, role } },
      create: { userId, role, grantedByUserId },
      update: {},
    });
  }

  async setStatus(userId: string, status: UserStatus) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status,
        approvedAt: status === UserStatus.APPROVED ? new Date() : undefined,
      },
      include: userInclude,
    });
  }

  serializeMe(
    user: Prisma.UserGetPayload<{ include: typeof userInclude }>,
  ) {
    return {
      id: user.id,
      telegramUserId: user.telegramUserId.toString(),
      telegramUsername: user.telegramUsername,
      firstName: user.firstName,
      lastName: user.lastName,
      locale: user.locale,
      status: user.status,
      roles: user.roles.map((r) => r.role),
      vouchedBy: user.vouchedByUser
        ? {
            id: user.vouchedByUser.id,
            firstName: user.vouchedByUser.firstName,
          }
        : null,
    };
  }
}
