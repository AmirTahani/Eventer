import { Prisma } from '@prisma/client';
import { moneyString } from '../common/money';

export type PricingTierLike = {
  name: string | null;
  price: Prisma.Decimal | string | number;
  currency: string;
  startsAt: Date;
  sortOrder: number;
};

export type ActivePrice = {
  amount: string;
  currency: string;
  tierName: string | null;
};

export type PriceIncreaseHint = {
  nextAmount: string;
  startsAt: string;
} | null;

/**
 * D16 active-tier resolver.
 * Active tier = latest tier with startsAt <= now, before next tier's startsAt
 * (derived end). Falls back to Event.price when no tiers or before first tier.
 */
export function resolveActivePrice(
  basePrice: Prisma.Decimal | string | number,
  baseCurrency: string,
  tiers: PricingTierLike[],
  now: Date = new Date(),
): ActivePrice {
  if (!tiers.length) {
    return {
      amount: moneyString(basePrice),
      currency: baseCurrency,
      tierName: null,
    };
  }

  const sorted = [...tiers].sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
  );

  for (let i = 0; i < sorted.length; i++) {
    const tier = sorted[i]!;
    const nextStarts = sorted[i + 1]?.startsAt;
    if (
      tier.startsAt.getTime() <= now.getTime() &&
      (!nextStarts || now.getTime() < nextStarts.getTime())
    ) {
      return {
        amount: moneyString(tier.price),
        currency: tier.currency,
        tierName: tier.name,
      };
    }
  }

  return {
    amount: moneyString(basePrice),
    currency: baseCurrency,
    tierName: null,
  };
}

export function resolvePriceIncreaseHint(
  tiers: PricingTierLike[],
  now: Date = new Date(),
): PriceIncreaseHint {
  if (!tiers.length) return null;
  const sorted = [...tiers].sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
  );
  const next = sorted.find((t) => t.startsAt.getTime() > now.getTime());
  if (!next) return null;
  return {
    nextAmount: moneyString(next.price),
    startsAt: next.startsAt.toISOString(),
  };
}

export function validatePricingTiersInput(
  tiers: Array<{ startsAt: Date; price: string }>,
  eventStartAt: Date,
): string | null {
  if (!tiers.length) return null;
  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i]!;
    if (!(t.startsAt.getTime() < eventStartAt.getTime())) {
      return 'All pricing tier startsAt values must be before event startAt';
    }
    if (i > 0 && !(t.startsAt.getTime() > tiers[i - 1]!.startsAt.getTime())) {
      return 'Pricing tier startsAt values must be strictly increasing';
    }
  }
  return null;
}
