/** Minimal in-process Prometheus text exposition (no external deps). */
class MetricsRegistry {
  private readonly counters = new Map<string, number>();

  inc(name: string, by = 1): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + by);
  }

  render(): string {
    const lines: string[] = [
      '# HELP eventer_up Always 1 when the process is running',
      '# TYPE eventer_up gauge',
      'eventer_up 1',
    ];
    for (const [name, value] of this.counters) {
      lines.push(`# TYPE ${name} counter`);
      lines.push(`${name} ${value}`);
    }
    return `${lines.join('\n')}\n`;
  }
}

export const metricsRegistry = new MetricsRegistry();
