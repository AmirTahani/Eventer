import {
  signTelegramLoginPayload,
  verifyTelegramLoginHash,
} from './telegram-login.util';

describe('verifyTelegramLoginHash', () => {
  const botToken = '123456:ABC-DEF';

  it('accepts a freshly signed payload', () => {
    const base = {
      id: 42,
      first_name: 'Amir',
      username: 'amir',
      auth_date: Math.floor(Date.now() / 1000),
    };
    const hash = signTelegramLoginPayload(base, botToken);
    expect(verifyTelegramLoginHash({ ...base, hash }, botToken)).toEqual({
      ok: true,
    });
  });

  it('rejects a tampered hash', () => {
    const base = {
      id: 42,
      first_name: 'Amir',
      auth_date: Math.floor(Date.now() / 1000),
    };
    const hash = signTelegramLoginPayload(base, botToken);
    const tampered = 'ff'.repeat(32);
    expect(tampered).not.toEqual(hash);
    const result = verifyTelegramLoginHash(
      { ...base, hash: tampered },
      botToken,
    );
    expect(result).toEqual({ ok: false, reason: 'invalid_hash' });
  });

  it('rejects expired auth_date', () => {
    const base = {
      id: 42,
      first_name: 'Amir',
      auth_date: Math.floor(Date.now() / 1000) - 120,
    };
    const hash = signTelegramLoginPayload(base, botToken);
    expect(verifyTelegramLoginHash({ ...base, hash }, botToken)).toEqual({
      ok: false,
      reason: 'expired',
    });
  });
});
