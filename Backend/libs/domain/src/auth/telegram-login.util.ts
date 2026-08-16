import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export type TelegramLoginPayload = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

/**
 * Verifies Telegram Login Widget payloads per
 * https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramLoginHash(
  payload: TelegramLoginPayload,
  botToken: string,
  maxAgeSeconds = 60,
): { ok: true } | { ok: false; reason: 'invalid_hash' | 'expired' } {
  const now = Math.floor(Date.now() / 1000);
  if (now - payload.auth_date > maxAgeSeconds) {
    return { ok: false, reason: 'expired' };
  }

  const { hash, ...fields } = payload;
  const dataCheckString = Object.keys(fields)
    .sort()
    .map((key) => `${key}:${(fields as Record<string, unknown>)[key]}`)
    .join('\n');

  const secretKey = createHash('sha256').update(botToken).digest();
  const computed = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  const a = Buffer.from(computed, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: 'invalid_hash' };
  }

  return { ok: true };
}

/** Dev/test helper: build a valid hash for a payload. */
export function signTelegramLoginPayload(
  payload: Omit<TelegramLoginPayload, 'hash'>,
  botToken: string,
): string {
  const dataCheckString = Object.keys(payload)
    .sort()
    .map((key) => `${key}:${(payload as Record<string, unknown>)[key]}`)
    .join('\n');
  const secretKey = createHash('sha256').update(botToken).digest();
  return createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
}
