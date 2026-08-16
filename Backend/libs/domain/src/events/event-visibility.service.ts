import { Injectable } from '@nestjs/common';
import {
  EventAccessGrantType,
  EventStatus,
  EventVisibilityMode,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '@eventer/db';
import { AuthUser, isAdmin } from '../auth/policies';

export type EventVisibilitySubject = {
  id: string;
  organizerId: string;
  status: EventStatus;
  visibilityMode: EventVisibilityMode;
  deletedAt: Date | null;
  accessGrants: Array<{
    grantType: EventAccessGrantType;
    subjectUserId: string | null;
  }>;
};

@Injectable()
export class EventVisibilityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Query-level visibility filter for list endpoints.
   * Organizer/Admin see own drafts; others only non-draft published events they can access.
   */
  async visibilityWhere(user: AuthUser): Promise<Prisma.EventWhereInput> {
    const admin = isAdmin(user);

    if (admin) {
      return { deletedAt: null };
    }

    const me = await this.prisma.user.findFirst({
      where: { id: user.id, deletedAt: null },
      select: { vouchedByUserId: true },
    });

    const voucherSubjectIds = [
      user.id,
      ...(me?.vouchedByUserId ? [me.vouchedByUserId] : []),
    ];

    return {
      deletedAt: null,
      OR: [
        { organizerId: user.id },
        {
          AND: [
            { status: { not: EventStatus.DRAFT } },
            {
              OR: [
                { visibilityMode: EventVisibilityMode.ALL_APPROVED },
                {
                  visibilityMode: {
                    in: [
                      EventVisibilityMode.SELECTED_USERS,
                      EventVisibilityMode.INVITE_ONLY,
                    ],
                  },
                  accessGrants: {
                    some: {
                      grantType: EventAccessGrantType.USER,
                      subjectUserId: user.id,
                    },
                  },
                },
                {
                  visibilityMode: EventVisibilityMode.SELECTED_VOUCHERS,
                  accessGrants: {
                    some: {
                      grantType: EventAccessGrantType.VOUCHER_INVITEES,
                      subjectUserId: { in: voucherSubjectIds },
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    };
  }

  async canSeeEvent(
    user: AuthUser,
    event: EventVisibilitySubject,
  ): Promise<boolean> {
    if (event.deletedAt) return false;
    if (isAdmin(user) || event.organizerId === user.id) return true;
    if (event.status === EventStatus.DRAFT) return false;

    switch (event.visibilityMode) {
      case EventVisibilityMode.ALL_APPROVED:
        return true;
      case EventVisibilityMode.SELECTED_USERS:
      case EventVisibilityMode.INVITE_ONLY:
        return event.accessGrants.some(
          (g) =>
            g.grantType === EventAccessGrantType.USER &&
            g.subjectUserId === user.id,
        );
      case EventVisibilityMode.SELECTED_VOUCHERS: {
        const me = await this.prisma.user.findFirst({
          where: { id: user.id, deletedAt: null },
          select: { vouchedByUserId: true },
        });
        const allowed = new Set(
          event.accessGrants
            .filter(
              (g) => g.grantType === EventAccessGrantType.VOUCHER_INVITEES,
            )
            .map((g) => g.subjectUserId)
            .filter((id): id is string => !!id),
        );
        if (allowed.has(user.id)) return true;
        return !!(me?.vouchedByUserId && allowed.has(me.vouchedByUserId));
      }
      default:
        return false;
    }
  }
}
