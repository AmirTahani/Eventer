import { describe, expect, it } from 'vitest';
import {
  normalizeTelegramBotUsername,
  parseTelegramLoginSearch,
  telegramBotUrl,
} from './telegram';

describe('normalizeTelegramBotUsername', () => {
  it('strips @ and accepts a real bot username', () => {
    expect(normalizeTelegramBotUsername('@Eventer_advance_bot')).toBe(
      'Eventer_advance_bot',
    );
  });

  it('rejects placeholders', () => {
    expect(
      normalizeTelegramBotUsername('REPLACE_WITH_BOT_USERNAME'),
    ).toBeNull();
  });
});

describe('parseTelegramLoginSearch', () => {
  it('reads Telegram redirect query params without empty optional fields', () => {
    const payload = parseTelegramLoginSearch(
      '?id=42&first_name=Amir&auth_date=1710000000&hash=abc&username=amir',
    );
    expect(payload).toEqual({
      id: 42,
      first_name: 'Amir',
      auth_date: 1710000000,
      hash: 'abc',
      username: 'amir',
    });
    expect(payload).not.toHaveProperty('last_name');
  });
});

describe('telegramBotUrl', () => {
  it('builds a t.me link', () => {
    expect(telegramBotUrl('Eventer_advance_bot')).toBe(
      'https://t.me/Eventer_advance_bot',
    );
  });
});
