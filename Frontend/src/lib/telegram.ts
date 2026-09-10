/**
 * Telegram Login Widget usernames are public. Reject placeholders left in env files.
 */
export function normalizeTelegramBotUsername(
  raw?: string | null,
): string | null {
  if (!raw) return null;
  const name = raw.trim().replace(/^@/, '');
  if (!name) return null;
  if (/replace/i.test(name)) return null;
  if (!/^[A-Za-z0-9_]{5,32}$/.test(name)) return null;
  return name;
}

export function resolveTelegramBotUsername(): string | null {
  return (
    normalizeTelegramBotUsername(process.env.TELEGRAM_BOT_USERNAME) ??
    normalizeTelegramBotUsername(process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME)
  );
}

export function telegramBotUrl(username: string): string {
  return `https://t.me/${username}`;
}

export type TelegramLoginPayload = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

export function parseTelegramLoginSearch(
  search: string,
): TelegramLoginPayload | null {
  const params = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  );
  const id = params.get('id');
  const firstName = params.get('first_name');
  const authDate = params.get('auth_date');
  const hash = params.get('hash');
  if (!id || !firstName || !authDate || !hash) return null;

  const payload: TelegramLoginPayload = {
    id: Number(id),
    first_name: firstName,
    auth_date: Number(authDate),
    hash,
  };
  const lastName = params.get('last_name');
  const username = params.get('username');
  const photoUrl = params.get('photo_url');
  if (lastName) payload.last_name = lastName;
  if (username) payload.username = username;
  if (photoUrl) payload.photo_url = photoUrl;
  if (!Number.isFinite(payload.id) || !Number.isFinite(payload.auth_date)) {
    return null;
  }
  return payload;
}
