import { CapacityReservationStatus, Prisma } from '@prisma/client';

export type CapacityDecision =
  | { kind: 'ok'; remaining: number }
  | { kind: 'insufficient'; remaining: number; requested: number }
  | { kind: 'waitlist'; remaining: number };

/**
 * Pure capacity decision used inside the locked transaction and unit-tested.
 * - remaining === 0 → waitlist
 * - 0 < remaining < requested → insufficient (409 path)
 * - remaining >= requested → ok
 */
export function decideCapacityOutcome(
  capacity: number,
  used: number,
  requested: number,
): CapacityDecision {
  const remaining = Math.max(0, capacity - used);
  if (remaining <= 0) {
    return { kind: 'waitlist', remaining: 0 };
  }
  if (requested > remaining) {
    return { kind: 'insufficient', remaining, requested };
  }
  return { kind: 'ok', remaining };
}

export async function lockEventRow(
  tx: Prisma.TransactionClient,
  eventId: string,
): Promise<{ id: string; capacity: number } | null> {
  const rows = await tx.$queryRaw<Array<{ id: string; capacity: number }>>`
    SELECT id, capacity FROM events WHERE id = ${eventId} AND deleted_at IS NULL FOR UPDATE
  `;
  return rows[0] ?? null;
}

export async function sumActiveReservations(
  tx: Prisma.TransactionClient,
  eventId: string,
): Promise<number> {
  const used = await tx.capacityReservation.aggregate({
    where: { eventId, status: CapacityReservationStatus.ACTIVE },
    _sum: { peopleCount: true },
  });
  return used._sum.peopleCount ?? 0;
}
