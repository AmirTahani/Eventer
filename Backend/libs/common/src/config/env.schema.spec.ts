import { validateEnv } from './env.schema';

describe('validateEnv', () => {
  it('accepts a minimal valid config', () => {
    const env = validateEnv({
      DATABASE_URL: 'postgresql://eventer@localhost:5432/events',
      JWT_SECRET: 'dev-jwt-secret-change-me',
      REFRESH_TOKEN_SECRET: 'dev-refresh-secret-change-me',
    });

    expect(env.PORT).toBe(3000);
    expect(env.PAYMENT_PROVIDER).toBe('mock');
    expect(env.TELEGRAM_BOT_USERNAME).toBe('EventBot');
  });

  it('rejects a missing DATABASE_URL', () => {
    expect(() =>
      validateEnv({
        JWT_SECRET: 'dev-jwt-secret-change-me',
        REFRESH_TOKEN_SECRET: 'dev-refresh-secret-change-me',
      }),
    ).toThrow(/DATABASE_URL/);
  });

  it('requires OrcaRail credentials when PAYMENT_PROVIDER=orcarail', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: 'postgresql://eventer@localhost:5432/events',
        PAYMENT_PROVIDER: 'orcarail',
      }),
    ).toThrow(/ORCARAIL_API_KEY/);
  });

  it('accepts a full orcarail config', () => {
    const env = validateEnv({
      DATABASE_URL: 'postgresql://eventer@localhost:5432/events',
      PAYMENT_PROVIDER: 'orcarail',
      ORCARAIL_API_KEY: 'ak_test',
      ORCARAIL_API_SECRET: 'sk_test',
      ORCARAIL_TOKEN_ID: 'token-usdc-uuid',
      ORCARAIL_NETWORK_ID: 'network-polygon-uuid',
      ORCARAIL_RETURN_URL: 'http://localhost:3001/payments/return',
    });
    expect(env.PAYMENT_PROVIDER).toBe('orcarail');
    expect(env.ORCARAIL_BASE_URL).toBe('https://api.orcarail.com/api/v1');
    expect(env.ORCARAIL_TOKEN_ID).toBe('token-usdc-uuid');
  });

  it('accepts blank OrcaRail fields when using mock provider', () => {
    const env = validateEnv({
      DATABASE_URL: 'postgresql://eventer@localhost:5432/events',
      PAYMENT_PROVIDER: 'mock',
      ORCARAIL_API_KEY: '',
      ORCARAIL_TOKEN_ID: '',
      ORCARAIL_RETURN_URL: '',
    });
    expect(env.PAYMENT_PROVIDER).toBe('mock');
    expect(env.ORCARAIL_API_KEY).toBeUndefined();
  });

  it('rejects invalid PAYMENT_PROVIDER values', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: 'postgresql://eventer@localhost:5432/events',
        PAYMENT_PROVIDER: 'stripe',
      }),
    ).toThrow(/PAYMENT_PROVIDER/);
  });

  it('requires each OrcaRail field individually when provider is orcarail', () => {
    const base = {
      DATABASE_URL: 'postgresql://eventer@localhost:5432/events',
      PAYMENT_PROVIDER: 'orcarail',
      ORCARAIL_API_KEY: 'ak',
      ORCARAIL_API_SECRET: 'sk',
      ORCARAIL_TOKEN_ID: 'tok',
      ORCARAIL_NETWORK_ID: 'net',
      ORCARAIL_RETURN_URL: 'http://localhost:3001/payments/return',
    };
    expect(() =>
      validateEnv({ ...base, ORCARAIL_API_SECRET: '' }),
    ).toThrow(/ORCARAIL_API_SECRET/);
    expect(() =>
      validateEnv({ ...base, ORCARAIL_TOKEN_ID: undefined }),
    ).toThrow(/ORCARAIL_TOKEN_ID/);
    expect(() =>
      validateEnv({ ...base, ORCARAIL_NETWORK_ID: '' }),
    ).toThrow(/ORCARAIL_NETWORK_ID/);
    expect(() =>
      validateEnv({ ...base, ORCARAIL_RETURN_URL: '' }),
    ).toThrow(/ORCARAIL_RETURN_URL/);
  });

  it('accepts a custom ORCARAIL_BASE_URL for self-host', () => {
    const env = validateEnv({
      DATABASE_URL: 'postgresql://eventer@localhost:5432/events',
      PAYMENT_PROVIDER: 'orcarail',
      ORCARAIL_API_KEY: 'ak',
      ORCARAIL_API_SECRET: 'sk',
      ORCARAIL_TOKEN_ID: 'tok',
      ORCARAIL_NETWORK_ID: 'net',
      ORCARAIL_RETURN_URL: 'https://app.example/payments/return',
      ORCARAIL_BASE_URL: 'https://payments.internal/api/v1',
      ORCARAIL_CANCEL_URL: 'https://app.example/payments/cancel',
    });
    expect(env.ORCARAIL_BASE_URL).toBe('https://payments.internal/api/v1');
    expect(env.ORCARAIL_CANCEL_URL).toBe(
      'https://app.example/payments/cancel',
    );
  });
});
