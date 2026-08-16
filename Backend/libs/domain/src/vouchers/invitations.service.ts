import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvitationStatus, UserStatus } from '@prisma/client';
import type { Env } from '@eventer/common';
import { PrismaService } from '@eventer/db';
import { nanoid } from '../common/nanoid';
import { AuthUser } from '../auth/policies';
import { PoliciesService } from '../auth/policies.service';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policies: PoliciesService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async create(
    actor: AuthUser,
    input: { invitedTelegramUsername?: string },
  ) {
    if (!this.policies.canInvite(actor)) {
      throw new ConflictException('Voucher or Admin role required');
    }

    const token = nanoid(10);
    const botUsername =
      this.config.get('TELEGRAM_BOT_USERNAME', { infer: true }) ?? 'EventBot';

    const invitation = await this.prisma.invitation.create({
      data: {
        voucherUserId: actor.id,
        invitedTelegramUsername: input.invitedTelegramUsername,
        token,
        status: InvitationStatus.PENDING,
      },
    });

    return {
      id: invitation.id,
      token: invitation.token,
      deepLink: `https://t.me/${botUsername}?start=invite_${invitation.token}`,
      status: invitation.status,
      createdAt: invitation.createdAt.toISOString(),
    };
  }

  /**
   * Idempotent accept: same acceptor + already ACCEPTED → 200 with existing user.
   * Different acceptor on ACCEPTED/REVOKED → 409.
   */
  async accept(
    token: string,
    input: {
      telegramUserId: string;
      telegramUsername?: string;
      firstName: string;
    },
  ) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const telegramUserId = BigInt(input.telegramUserId);

    if (invitation.status === InvitationStatus.REVOKED) {
      throw new ConflictException('Invitation has been revoked');
    }

    if (invitation.status === InvitationStatus.ACCEPTED) {
      if (
        invitation.acceptedUserId &&
        invitation.invitedTelegramUserId === telegramUserId
      ) {
        const user = await this.prisma.user.findUniqueOrThrow({
          where: { id: invitation.acceptedUserId },
        });
        return { userId: user.id, status: user.status };
      }
      // Same telegram id may have been set on invitation without acceptedUserId race
      if (invitation.invitedTelegramUserId === telegramUserId) {
        const existing = await this.prisma.user.findFirst({
          where: { telegramUserId, deletedAt: null },
        });
        if (existing) {
          return { userId: existing.id, status: existing.status };
        }
      }
      throw new ConflictException('Invitation already accepted');
    }

    return this.prisma.$transaction(async (tx) => {
      const fresh = await tx.invitation.findUnique({ where: { token } });
      if (!fresh || fresh.status !== InvitationStatus.PENDING) {
        // concurrent accept — re-run idempotent path
        if (fresh?.status === InvitationStatus.ACCEPTED) {
          if (fresh.invitedTelegramUserId === telegramUserId && fresh.acceptedUserId) {
            const user = await tx.user.findUniqueOrThrow({
              where: { id: fresh.acceptedUserId },
            });
            return { userId: user.id, status: user.status };
          }
          throw new ConflictException('Invitation already accepted');
        }
        throw new ConflictException('Invitation is not pending');
      }

      let user = await tx.user.findFirst({
        where: { telegramUserId, deletedAt: null },
      });

      if (user) {
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            firstName: input.firstName,
            telegramUsername:
              input.telegramUsername ?? user.telegramUsername,
            status: UserStatus.APPROVED,
            approvedAt: user.approvedAt ?? new Date(),
            vouchedByUserId: user.vouchedByUserId ?? fresh.voucherUserId,
            invitedAt: user.invitedAt ?? fresh.createdAt,
          },
        });
      } else {
        user = await tx.user.create({
          data: {
            telegramUserId,
            firstName: input.firstName,
            telegramUsername: input.telegramUsername,
            status: UserStatus.APPROVED,
            approvedAt: new Date(),
            vouchedByUserId: fresh.voucherUserId,
            invitedAt: fresh.createdAt,
          },
        });
      }

      await tx.invitation.update({
        where: { id: fresh.id },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedAt: new Date(),
          acceptedUserId: user.id,
          invitedTelegramUserId: telegramUserId,
          invitedTelegramUsername:
            input.telegramUsername ?? fresh.invitedTelegramUsername,
        },
      });

      return { userId: user.id, status: user.status };
    });
  }
}
