import { EventStatus, RegistrationStatus } from '@prisma/client';
import {
  EventRemindersService,
  REMINDER_OFFSETS,
} from './event-reminders.service';

describe('EventRemindersService', () => {
  describe('dueOffsets', () => {
    const startAt = new Date('2026-08-20T18:00:00.000Z');
    const service = new EventRemindersService({} as never, {} as never);

    it('returns no offsets when event has started', () => {
      expect(
        service.dueOffsets(startAt, new Date('2026-08-20T18:00:00.000Z')),
      ).toEqual([]);
    });

    it('returns 24h when within 24h window but before 2h', () => {
      const now = new Date(startAt.getTime() - 3 * 60 * 60 * 1000);
      expect(service.dueOffsets(startAt, now)).toEqual(['24h']);
    });

    it('returns 24h and 2h when within 2h window but before 30min', () => {
      const now = new Date(startAt.getTime() - 45 * 60 * 1000);
      expect(service.dueOffsets(startAt, now)).toEqual(['24h', '2h']);
    });

    it('returns all three offsets within 30min of start', () => {
      const now = new Date(startAt.getTime() - 10 * 60 * 1000);
      expect(service.dueOffsets(startAt, now)).toEqual(['24h', '2h', '30min']);
    });

    it('returns nothing more than 24h before start', () => {
      const now = new Date(startAt.getTime() - 25 * 60 * 60 * 1000);
      expect(service.dueOffsets(startAt, now)).toEqual([]);
    });
  });

  it('scheduleForEvent enqueues with idempotent dedupe keys', async () => {
    const startAt = new Date(Date.now() + 20 * 60 * 1000);
    const enqueue = jest.fn().mockResolvedValue({ id: 'n1' });
    const prisma = {
      event: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'evt-1',
          startAt,
          name: 'Night',
          status: EventStatus.OPEN,
        }),
      },
      eventRegistration: {
        findMany: jest.fn().mockResolvedValue([
          { primaryUserId: 'u1' },
          { primaryUserId: 'u2' },
        ]),
      },
    };
    const notifications = { enqueue } as never;
    const service = new EventRemindersService(prisma as never, notifications);

    const created = await service.scheduleForEvent('evt-1', new Date());
    expect(created).toBe(REMINDER_OFFSETS.length * 2);
    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'event.reminder.30min',
        dedupeKey: 'event:evt-1:reminder:30min:user:u1',
        entityType: 'Event',
        entityId: 'evt-1',
        recipientUserId: 'u1',
      }),
    );
    expect(prisma.eventRegistration.findMany).toHaveBeenCalledWith({
      where: {
        eventId: 'evt-1',
        status: RegistrationStatus.CONFIRMED,
      },
      select: { primaryUserId: true },
    });
  });
});
