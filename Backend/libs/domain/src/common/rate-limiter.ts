/**
 * Simple in-memory sliding-window rate limiter (MVP).
 * Swap for Redis-backed limiter in multi-instance production if needed.
 */
export class InMemoryRateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** Returns true if the request is allowed. */
  allow(key: string, now = Date.now()): boolean {
    const windowStart = now - this.windowMs;
    const prior = this.hits.get(key) ?? [];
    const recent = prior.filter((t) => t > windowStart);
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }

  reset(): void {
    this.hits.clear();
  }
}
