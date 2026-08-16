/**
 * Parse Telegram /start deep-link payload.
 * Supports `invite_<token>` (and optional leading `start=` wrappers).
 */
export function parseInviteStartPayload(
  payload: string | undefined | null,
): string | null {
  if (!payload) return null;
  const trimmed = payload.trim();
  if (!trimmed) return null;

  // Telegram may pass raw payload or full query fragment
  const withoutPrefix = trimmed.replace(/^start=/i, '');
  const match = withoutPrefix.match(/^invite_([A-Za-z0-9_-]+)$/);
  return match?.[1] ?? null;
}
