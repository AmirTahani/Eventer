import {
  EventAccessGrantType,
  EventStatus,
  EventVisibilityMode,
} from '@prisma/client';
import { EventVisibilityService } from './event-visibility.service';
import type { AuthUser } from '../auth/policies';

describe('EventVisibilityService', () => {
  const baseUser = (over: Partial<AuthUser> = {}): AuthUser => ({
    id: 'user-1',
    telegramUserId: '1',
    firstName: 'U',
    lastName: null,
    telegramUsername: null,
    locale: 'en',
    status: 'APPROVED',
    roles: [],
    ...over,
  });

  function service(prisma: Record<string, unknown> = {}) {
    return new EventVisibilityService(prisma as never);
  }

  const eventBase = {
    id: 'evt-1',
    organizerId: 'org-1',
    status: EventStatus.OPEN,
    deletedAt: null,
    accessGrants: [] as Array<{
      grantType: EventAccessGrantType;
      subjectUserId: string | null;
    }>,
  };

  it('allows ALL_APPROVED for any non-draft viewer', async () => {
    const ok = await service().canSeeEvent(baseUser(), {
      ...eventBase,
      visibilityMode: EventVisibilityMode.ALL_APPROVED,
    });
    expect(ok).toBe(true);
  });

  it('hides DRAFT from non-organizers', async () => {
    const ok = await service().canSeeEvent(baseUser(), {
      ...eventBase,
      status: EventStatus.DRAFT,
      visibilityMode: EventVisibilityMode.ALL_APPROVED,
    });
    expect(ok).toBe(false);
  });

  it('allows organizer to see own DRAFT', async () => {
    const ok = await service().canSeeEvent(baseUser({ id: 'org-1' }), {
      ...eventBase,
      status: EventStatus.DRAFT,
      visibilityMode: EventVisibilityMode.ALL_APPROVED,
    });
    expect(ok).toBe(true);
  });

  it('enforces SELECTED_USERS grants', async () => {
    const denied = await service().canSeeEvent(baseUser(), {
      ...eventBase,
      visibilityMode: EventVisibilityMode.SELECTED_USERS,
      accessGrants: [
        {
          grantType: EventAccessGrantType.USER,
          subjectUserId: 'other',
        },
      ],
    });
    expect(denied).toBe(false);

    const allowed = await service().canSeeEvent(baseUser(), {
      ...eventBase,
      visibilityMode: EventVisibilityMode.SELECTED_USERS,
      accessGrants: [
        {
          grantType: EventAccessGrantType.USER,
          subjectUserId: 'user-1',
        },
      ],
    });
    expect(allowed).toBe(true);
  });

  it('enforces INVITE_ONLY like selected users', async () => {
    const ok = await service().canSeeEvent(baseUser(), {
      ...eventBase,
      visibilityMode: EventVisibilityMode.INVITE_ONLY,
      accessGrants: [],
    });
    expect(ok).toBe(false);
  });

  it('enforces SELECTED_VOUCHERS via vouchedBy', async () => {
    const svc = service({
      user: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ vouchedByUserId: 'voucher-9' }),
      },
    });

    const denied = await svc.canSeeEvent(baseUser(), {
      ...eventBase,
      visibilityMode: EventVisibilityMode.SELECTED_VOUCHERS,
      accessGrants: [
        {
          grantType: EventAccessGrantType.VOUCHER_INVITEES,
          subjectUserId: 'other-voucher',
        },
      ],
    });
    expect(denied).toBe(false);

    const allowed = await svc.canSeeEvent(baseUser(), {
      ...eventBase,
      visibilityMode: EventVisibilityMode.SELECTED_VOUCHERS,
      accessGrants: [
        {
          grantType: EventAccessGrantType.VOUCHER_INVITEES,
          subjectUserId: 'voucher-9',
        },
      ],
    });
    expect(allowed).toBe(true);
  });

  it('admins can always see', async () => {
    const ok = await service().canSeeEvent(baseUser({ roles: ['ADMIN'] }), {
      ...eventBase,
      status: EventStatus.DRAFT,
      visibilityMode: EventVisibilityMode.INVITE_ONLY,
      accessGrants: [],
    });
    expect(ok).toBe(true);
  });
});
