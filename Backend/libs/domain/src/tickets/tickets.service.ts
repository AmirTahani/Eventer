import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Prisma,
  TicketHolderType,
  TicketStatus,
} from '@prisma/client';
import { PrismaService } from '@eventer/db';
import { AuthUser } from '../auth/policies';

export function signTicketQrToken(ticketId: string, secret: string): string {
  const sig = createHmac('sha256', secret).update(ticketId).digest('hex');
  return `${ticketId}.${sig}`;
}

export function verifyTicketQrToken(
  token: string,
  secret: string,
): string | null {
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const ticketId = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!ticketId || !sig) return null;
  const expected = createHmac('sha256', secret).update(ticketId).digest('hex');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return ticketId;
}

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private qrSecret(): string {
    return (
      this.config.get<string>('TICKET_QR_SECRET') ??
      'dev-ticket-qr-secret-change'
    );
  }

  signToken(ticketId: string): string {
    return signTicketQrToken(ticketId, this.qrSecret());
  }

  parseToken(token: string): string | null {
    return verifyTicketQrToken(token, this.qrSecret());
  }

  /**
   * Issue primary + guest tickets for a confirmed registration (idempotent).
   */
  async issueForRegistration(
    registrationId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;
    const existing = await db.ticket.count({ where: { registrationId } });
    if (existing > 0) {
      return db.ticket.findMany({ where: { registrationId } });
    }

    const reg = await db.eventRegistration.findUniqueOrThrow({
      where: { id: registrationId },
      include: { guests: true },
    });

    const created = [];
    const primary = await db.ticket.create({
      data: {
        registrationId,
        holderType: TicketHolderType.PRIMARY,
        guestId: null,
        qrToken: `pending-primary-${registrationId}`,
        status: TicketStatus.ISSUED,
      },
    });
    created.push(
      await db.ticket.update({
        where: { id: primary.id },
        data: { qrToken: this.signToken(primary.id) },
      }),
    );

    for (const guest of reg.guests) {
      const t = await db.ticket.create({
        data: {
          registrationId,
          holderType: TicketHolderType.GUEST,
          guestId: guest.id,
          qrToken: `pending-guest-${guest.id}`,
          status: TicketStatus.ISSUED,
        },
      });
      created.push(
        await db.ticket.update({
          where: { id: t.id },
          data: { qrToken: this.signToken(t.id) },
        }),
      );
    }

    return created;
  }

  async listMine(user: AuthUser) {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        OR: [
          { registration: { primaryUserId: user.id } },
          { guest: { linkedUserId: user.id } },
        ],
        status: { not: TicketStatus.VOID },
      },
      include: {
        registration: { include: { event: true } },
        guest: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      items: tickets.map((t) => ({
        id: t.id,
        eventId: t.registration.eventId,
        eventName: t.registration.event.name,
        holderType: t.holderType,
        status: t.status,
        qrTokenPresent: true,
        // Opaque QR image rendering is client-side from a signed scan endpoint;
        // never return the raw qrToken in list payloads.
        qrImageHint: 'Use organizer check-in scan with the ticket QR token',
      })),
    };
  }
}

/** Milestone 10: signed QR tickets */
