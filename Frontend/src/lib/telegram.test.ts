import { describe, expect, it } from 'vitest';
import {
  normalizeTelegramBotUsername,
  parseTelegramLoginSearch,
  resolveTelegramBotUsername,
  telegramBotUrl,
} from './telegram';

describe('normalizeTelegramBotUsername', () => {
  it('strips @ and accepts a real bot username', () => {
    expect(normalizeTelegramBotUsername('@Eventer_advance_bot')).toBe(
      'Eventer_advance_bot',
    );
  });

  it('rejects placeholders and short names', () => {
    expect(
      normalizeTelegramBotUsername('REPLACE_WITH_BOT_USERNAME'),
    ).toBeNull();
    expect(normalizeTelegramBotUsername('bot')).toBeNull();
    expect(normalizeTelegramBotUsername('')).toBeNull();
    expect(normalizeTelegramBotUsername(null)).toBeNull();
    expect(normalizeTelegramBotUsername('bad name!')).toBeNull();
  });

  it('trims whitespace', () => {
    expect(normalizeTelegramBotUsername('  EventBot  ')).toBe('EventBot');
  });
});

describe('resolveTelegramBotUsername', () => {
  it('prefers TELEGRAM_BOT_USERNAME over NEXT_PUBLIC', () => {
    const prevA = process.env.TELEGRAM_BOT_USERNAME;
    const prevB = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    process.env.TELEGRAM_BOT_USERNAME = 'RuntimeBot';
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME = 'PublicBot';
    expect(resolveTelegramBotUsername()).toBe('RuntimeBot');
    process.env.TELEGRAM_BOT_USERNAME = prevA;
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME = prevB;
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

  it('returns null when required fields are missing or non-numeric', () => {
    expect(parseTelegramLoginSearch('?id=42&first_name=Amir')).toBeNull();
    expect(
      parseTelegramLoginSearch(
        '?id=x&first_name=Amir&auth_date=1&hash=abc',
      ),
    ).toBeNull();
  });

  it('accepts leading ? or raw query string and optional fields', () => {
    const payload = parseTelegramLoginSearch(
      'id=7&first_name=Sara&last_name=R&auth_date=10&hash=zz&photo_url=https://x',
    );
    expect(payload).toMatchObject({
      id: 7,
      first_name: 'Sara',
      last_name: 'R',
      photo_url: 'https://x',
    });
  });
});

describe('telegramBotUrl', () => {
  it('builds a t.me link', () => {
    expect(telegramBotUrl('Eventer_advance_bot')).toBe(
      'https://t.me/Eventer_advance_bot',
    );
  });
});
