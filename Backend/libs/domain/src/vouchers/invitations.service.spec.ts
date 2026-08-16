import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvitationStatus, UserStatus } from '@prisma/client';
import { InvitationsService } from './invitations.service';
import { PoliciesService } from '../auth/policies.service';

describe('InvitationsService', () => {
  const actor = {
    id: 'voucher-1',
    telegramUserId: '1',
    firstName: 'V',
    lastName: null,
    telegramUsername: 'voucher',
    locale: 'en' as const,
    status: 'APPROVED' as const,
    roles: ['VOUCHER' as const],
  };

  function build(prisma: Record<string, unknown>) {
    const policies = {
      canInvite: jest.fn().mockReturnValue(true),
    } as unknown as PoliciesService;
    const config = {
      get: jest.fn().mockReturnValue('EventBot'),
    } as unknown as ConfigService;
    return new InvitationsService(prisma as never, policies, config as never);
  }

  it('rejects invalid token', async () => {
    const service = build({
      invitation: { findUnique: jest.fn().mockResolvedValue(null) },
    });
    await expect(
      service.accept('missing', {
        telegramUserId: '99',
        firstName: 'New',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('accepts idempotently for the same telegram user', async () => {
    const invitation = {
      id: 'inv-1',
      token: 'abc',
      status: InvitationStatus.ACCEPTED,
      voucherUserId: 'voucher-1',
      invitedTelegramUserId: 99n,
      acceptedUserId: 'user-9',
    };
    const service = build({
      invitation: { findUnique: jest.fn().mockResolvedValue(invitation) },
      user: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'user-9',
          status: UserStatus.APPROVED,
        }),
      },
    });

    const first = await service.accept('abc', {
      telegramUserId: '99',
      firstName: 'New',
    });
    const second = await service.accept('abc', {
      telegramUserId: '99',
      firstName: 'New',
    });

    expect(first).toEqual({ userId: 'user-9', status: UserStatus.APPROVED });
    expect(second).toEqual(first);
  });

  it('conflicts when a different user retries an accepted invite', async () => {
    const invitation = {
      id: 'inv-1',
      token: 'abc',
      status: InvitationStatus.ACCEPTED,
      voucherUserId: 'voucher-1',
      invitedTelegramUserId: 99n,
      acceptedUserId: 'user-9',
    };
    const service = build({
      invitation: { findUnique: jest.fn().mockResolvedValue(invitation) },
    });

    await expect(
      service.accept('abc', {
        telegramUserId: '100',
        firstName: 'Other',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates invitation with deep link', async () => {
    const created = {
      id: 'inv-1',
      token: 'tok1234567',
      status: InvitationStatus.PENDING,
      createdAt: new Date('2026-08-16T10:00:00.000Z'),
    };
    const service = build({
      invitation: { create: jest.fn().mockResolvedValue(created) },
    });

    const result = await service.create(actor, {});
    expect(result.deepLink).toBe(
      'https://t.me/EventBot?start=invite_tok1234567',
    );
    expect(result.status).toBe('PENDING');
  });
});
