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
  });

  it('rejects a missing DATABASE_URL', () => {
    expect(() =>
      validateEnv({
        JWT_SECRET: 'dev-jwt-secret-change-me',
        REFRESH_TOKEN_SECRET: 'dev-refresh-secret-change-me',
      }),
    ).toThrow(/DATABASE_URL/);
  });
});
