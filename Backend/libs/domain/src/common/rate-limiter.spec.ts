import { InMemoryRateLimiter } from './rate-limiter';

describe('InMemoryRateLimiter', () => {
  it('allows up to limit within the window', () => {
    const limiter = new InMemoryRateLimiter(3, 1000);
    expect(limiter.allow('a', 100)).toBe(true);
    expect(limiter.allow('a', 200)).toBe(true);
    expect(limiter.allow('a', 300)).toBe(true);
    expect(limiter.allow('a', 400)).toBe(false);
  });

  it('resets after the window elapses', () => {
    const limiter = new InMemoryRateLimiter(1, 1000);
    expect(limiter.allow('b', 0)).toBe(true);
    expect(limiter.allow('b', 500)).toBe(false);
    expect(limiter.allow('b', 1001)).toBe(true);
  });

  it('tracks keys independently', () => {
    const limiter = new InMemoryRateLimiter(1, 1000);
    expect(limiter.allow('x', 0)).toBe(true);
    expect(limiter.allow('y', 0)).toBe(true);
    expect(limiter.allow('x', 1)).toBe(false);
  });
});
