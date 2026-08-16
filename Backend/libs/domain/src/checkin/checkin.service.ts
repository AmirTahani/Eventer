import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CheckInMethod, TicketStatus } from '@prisma/client';
import { PrismaService } from '@eventer/db';
import { AuthUser, canManageEvent } from '../auth/policies';
import { TicketsService } from '../tickets/tickets.service';

@Injectable()
export class CheckinService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tickets: TicketsService,
  ) {}

  private async requireEventManager(user: AuthUser, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (!canManageEvent(user, event.organizerId)) {
      throw new ForbiddenException('Not allowed to check in for this event');
    }
    return event;
  }

  private serializeTicket(
    ticket: {
      id: string;
      holderType: string;
      status: TicketStatus;
      registration: {
        primaryUser: { firstName: string; lastName: string | null };
      };
      guest: { firstName: string; lastName: string | null } | null;
      checkIns: Array<{
        checkedInAt: Date;
        checkedInByUser: { firstName: string; lastName: string | null };
      }>;
    },
    result: 'CHECKED_IN' | 'ALREADY_CHECKED_IN',
  ) {
    const last = ticket.checkIns[0];
    const holder =
      ticket.holderType === 'PRIMARY'
        ? ticket.registration.primaryUser
        : ticket.guest;
    const holderName = holder
      ? [holder.firstName, holder.lastName].filter(Boolean).join(' ')
      : 'Unknown';
    const checker = last?.checkedInByUser;
    return {
      result,
      ticket: {
        id: ticket.id,
        holderType: ticket.holderType,
        holderName,
        checkedInAt: last?.checkedInAt.toISOString() ?? null,
        checkedInBy: checker
          ? [checker.firstName, checker.lastName].filter(Boolean).join(' ')
          : null,
      },
    };
  }

  private async loadTicketForResponse(ticketId: string) {
    return this.prisma.ticket.findUniqueOrThrow({
      where: { id: ticketId },
      include: {
        registration: { include: { primaryUser: true } },
        guest: true,
        checkIns: {
          orderBy: { checkedInAt: 'desc' },
          take: 1,
          include: { checkedInByUser: true },
        },
      },
    });
  }

  async scan(user: AuthUser, input: { eventId: string; qrToken: string }) {
    await this.requireEventManager(user, input.eventId);
    const ticketId = this.tickets.parseToken(input.qrToken);
    if (!ticketId) {
      throw new NotFoundException('Ticket not found for token');
    }

    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { registration: true },
    });
    if (!ticket || ticket.registration.eventId !== input.eventId) {
      throw new NotFoundException('Ticket not found for token');
    }
    if (ticket.status === TicketStatus.VOID) {
      throw new ConflictException({
        statusCode: 409,
        error: 'TicketVoid',
        message: 'Ticket has been voided',
      });
    }

    return this.performCheckIn(user, ticket.id, input.eventId, CheckInMethod.QR);
  }

  async manual(user: AuthUser, input: { eventId: string; ticketId: string }) {
    await this.requireEventManager(user, input.eventId);
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: input.ticketId },
      include: { registration: true },
    });
    if (!ticket || ticket.registration.eventId !== input.eventId) {
      throw new NotFoundException('Ticket not found');
    }
    if (ticket.status === TicketStatus.VOID) {
      throw new ConflictException({
        statusCode: 409,
        error: 'TicketVoid',
        message: 'Ticket has been voided',
      });
    }
    return this.performCheckIn(
      user,
      ticket.id,
      input.eventId,
      CheckInMethod.MANUAL,
    );
  }

  private async performCheckIn(
    user: AuthUser,
    ticketId: string,
    eventId: string,
    method: CheckInMethod,
  ) {
    const current = await this.prisma.ticket.findUniqueOrThrow({
      where: { id: ticketId },
    });

    if (current.status === TicketStatus.CHECKED_IN) {
      const loaded = await this.loadTicketForResponse(ticketId);
      return this.serializeTicket(loaded, 'ALREADY_CHECKED_IN');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.CHECKED_IN },
      });
      await tx.checkIn.create({
        data: {
          ticketId,
          eventId,
          checkedInByUserId: user.id,
          method,
        },
      });
    });

    const loaded = await this.loadTicketForResponse(ticketId);
    return this.serializeTicket(loaded, 'CHECKED_IN');
  }
}

/** Milestone 10: check-in scan + manual */
