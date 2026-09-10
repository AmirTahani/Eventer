export function parseCorsOrigins(raw: string): string | string[] {
  const origins = raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (origins.length === 0) return raw;
  if (origins.length === 1) return origins[0];
  return origins;
}
