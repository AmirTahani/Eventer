import { AuditSource } from '@prisma/client';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  it('append writes actor, action, entity, before/after, and source', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'log-1' });
    const prisma = { auditLog: { create } };
    const service = new AuditService(prisma as never);

    await service.append({
      actorUserId: 'user-1',
      action: 'event.created',
      entityType: 'Event',
      entityId: 'evt-1',
      before: null,
      after: { name: 'Party' },
      source: AuditSource.WEB,
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        actorUserId: 'user-1',
        action: 'event.created',
        entityType: 'Event',
        entityId: 'evt-1',
        beforeState: null,
        afterState: { name: 'Party' },
        source: AuditSource.WEB,
        ipAddress: null,
      },
    });
  });

  it('list returns empty for organizer with no events', async () => {
    const prisma = {
      event: { findMany: jest.fn().mockResolvedValue([]) },
      auditLog: { findMany: jest.fn() },
    };
    const service = new AuditService(prisma as never);
    const organizer = {
      id: 'org-1',
      telegramUserId: '1',
      firstName: 'Org',
      lastName: null,
      telegramUsername: null,
      locale: 'en' as const,
      status: 'APPROVED' as const,
      roles: ['ORGANIZER' as const],
    };

    const result = await service.list(organizer, {});
    expect(result).toEqual({ items: [], nextCursor: null });
    expect(prisma.auditLog.findMany).not.toHaveBeenCalled();
  });

  it('list is unrestricted for admin', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      event: { findMany: jest.fn() },
      auditLog: { findMany },
    };
    const service = new AuditService(prisma as never);
    const admin = {
      id: 'admin-1',
      telegramUserId: '2',
      firstName: 'Admin',
      lastName: null,
      telegramUsername: null,
      locale: 'en' as const,
      status: 'APPROVED' as const,
      roles: ['ADMIN' as const],
    };

    await service.list(admin, { entityType: 'Event', limit: 10 });
    expect(prisma.event.findMany).not.toHaveBeenCalled();
    expect(findMany).toHaveBeenCalled();
    const calls = findMany.mock.calls as Array<[{ where?: unknown }]>;
    expect(calls[0]?.[0].where).toEqual({ AND: [{ entityType: 'Event' }] });
  });
});
