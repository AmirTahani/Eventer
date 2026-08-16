import { decideCapacityOutcome } from './capacity';

describe('decideCapacityOutcome', () => {
  it('returns ok when enough seats remain', () => {
    expect(decideCapacityOutcome(10, 7, 3)).toEqual({
      kind: 'ok',
      remaining: 3,
    });
  });

  it('returns insufficient when partial seats remain', () => {
    expect(decideCapacityOutcome(10, 7, 5)).toEqual({
      kind: 'insufficient',
      remaining: 3,
      requested: 5,
    });
  });

  it('returns waitlist when no seats remain', () => {
    expect(decideCapacityOutcome(10, 10, 2)).toEqual({
      kind: 'waitlist',
      remaining: 0,
    });
  });

  it('serializes contested last seats correctly (concurrency unit model)', () => {
    // Simulate N parallel attempts for the last 2 spots: after locking,
    // each sequential decision sees updated `used`.
    let used = 8;
    const capacity = 10;
    const outcomes: string[] = [];
    for (let i = 0; i < 5; i++) {
      const d = decideCapacityOutcome(capacity, used, 1);
      outcomes.push(d.kind);
      if (d.kind === 'ok') used += 1;
    }
    expect(outcomes.filter((k) => k === 'ok')).toHaveLength(2);
    expect(outcomes.filter((k) => k === 'waitlist')).toHaveLength(3);
  });
});
