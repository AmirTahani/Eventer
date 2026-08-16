import { Prisma } from '@prisma/client';

export function moneyString(value: Prisma.Decimal | string | number): string {
  return new Prisma.Decimal(value).toFixed(2);
}

export function moneyDecimal(value: string | number): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

export function moneyMultiply(
  unit: Prisma.Decimal | string | number,
  quantity: number,
): string {
  return new Prisma.Decimal(unit).mul(quantity).toFixed(2);
}
