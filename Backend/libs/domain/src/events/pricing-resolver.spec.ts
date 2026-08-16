import { Prisma } from '@prisma/client';
import {
  resolveActivePrice,
  resolvePriceIncreaseHint,
  validatePricingTiersInput,
} from './pricing-resolver';

describe('resolveActivePrice (D16)', () => {
  const tiers = [
    {
      name: 'Early',
      price: new Prisma.Decimal('50.00'),
      currency: 'USD',
      startsAt: new Date('2026-08-01T00:00:00.000Z'),
      sortOrder: 0,
    },
    {
      name: 'Standard',
      price: new Prisma.Decimal('75.00'),
      currency: 'USD',
      startsAt: new Date('2026-08-25T00:00:00.000Z'),
      sortOrder: 1,
    },
    {
      name: 'Last',
      price: new Prisma.Decimal('100.00'),
      currency: 'USD',
      startsAt: new Date('2026-09-04T00:00:00.000Z'),
      sortOrder: 2,
    },
  ];

  it('falls back to Event.price when no tiers', () => {
    expect(
      resolveActivePrice('75.00', 'USD', [], new Date('2026-08-20')),
    ).toEqual({ amount: '75.00', currency: 'USD', tierName: null });
  });

  it('falls back before the first tier starts', () => {
    expect(
      resolveActivePrice('75.00', 'USD', tiers, new Date('2026-07-15')),
    ).toEqual({ amount: '75.00', currency: 'USD', tierName: null });
  });

  it('selects early bird in its window', () => {
    expect(
      resolveActivePrice('75.00', 'USD', tiers, new Date('2026-08-10')),
    ).toEqual({ amount: '50.00', currency: 'USD', tierName: 'Early' });
  });

  it('selects standard after early ends', () => {
    expect(
      resolveActivePrice('75.00', 'USD', tiers, new Date('2026-08-26')),
    ).toEqual({ amount: '75.00', currency: 'USD', tierName: 'Standard' });
  });

  it('keeps last tier after it starts', () => {
    expect(
      resolveActivePrice('75.00', 'USD', tiers, new Date('2026-09-05')),
    ).toEqual({ amount: '100.00', currency: 'USD', tierName: 'Last' });
  });

  it('builds a price increase hint for the next tier', () => {
    expect(
      resolvePriceIncreaseHint(tiers, new Date('2026-08-10')),
    ).toEqual({
      nextAmount: '75.00',
      startsAt: '2026-08-25T00:00:00.000Z',
    });
  });

  it('validates strictly increasing startsAt before event start', () => {
    const eventStart = new Date('2026-09-05T19:00:00.000Z');
    expect(
      validatePricingTiersInput(
        [
          { startsAt: new Date('2026-08-01'), price: '50' },
          { startsAt: new Date('2026-08-01'), price: '75' },
        ],
        eventStart,
      ),
    ).toMatch(/strictly increasing/);

    expect(
      validatePricingTiersInput(
        [{ startsAt: new Date('2026-09-06'), price: '50' }],
        eventStart,
      ),
    ).toMatch(/before event startAt/);
  });
});
