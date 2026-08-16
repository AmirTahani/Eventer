import { z } from 'zod';

/** Treat blank env strings as unset (dotenv often loads `KEY=` as ""). */
const optionalNonEmpty = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  z.string().min(1).optional(),
);

const optionalUrl = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  z.string().url().optional(),
);

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
    JWT_SECRET: z.string().min(16).default('dev-jwt-secret-change-me'),
    JWT_EXPIRES_IN: z.string().default('15m'),
    REFRESH_TOKEN_SECRET: z
      .string()
      .min(16)
      .default('dev-refresh-secret-change-me'),
    TELEGRAM_BOT_TOKEN: z.string().optional(),
    TELEGRAM_BOT_USERNAME: z.string().min(1).default('EventBot'),
    TELEGRAM_WEBHOOK_SECRET: z.string().optional(),
    ADMIN_TELEGRAM_ID: z.string().optional(),
    BOT_SERVICE_TOKEN: z.string().min(16).default('dev-bot-service-token'),
    PAYMENT_PROVIDER: z.enum(['mock', 'orcarail']).default('mock'),
    PAYMENT_WEBHOOK_SECRET: z
      .string()
      .min(8)
      .default('dev-payment-webhook-secret'),
    TICKET_QR_SECRET: z.string().min(16).default('dev-ticket-qr-secret-change'),
    CORS_ORIGIN: z.string().default('http://localhost:3001'),
    SENTRY_DSN: z.string().optional(),
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET: z.string().optional(),
    R2_PUBLIC_BASE_URL: z.string().optional(),
    ORCARAIL_API_KEY: optionalNonEmpty,
    ORCARAIL_API_SECRET: optionalNonEmpty,
    ORCARAIL_BASE_URL: z
      .string()
      .url()
      .default('https://api.orcarail.com/api/v1'),
    ORCARAIL_WEBHOOK_SECRET: optionalNonEmpty,
    /** OrcaRail catalog token UUID (e.g. USDC) */
    ORCARAIL_TOKEN_ID: optionalNonEmpty,
    /** OrcaRail catalog network UUID */
    ORCARAIL_NETWORK_ID: optionalNonEmpty,
    ORCARAIL_RETURN_URL: optionalUrl,
    ORCARAIL_CANCEL_URL: optionalUrl,
  })
  .superRefine((env, ctx) => {
    if (env.PAYMENT_PROVIDER !== 'orcarail') return;
    const required: Array<keyof typeof env> = [
      'ORCARAIL_API_KEY',
      'ORCARAIL_API_SECRET',
      'ORCARAIL_TOKEN_ID',
      'ORCARAIL_NETWORK_ID',
      'ORCARAIL_RETURN_URL',
    ];
    for (const key of required) {
      const value = env[key];
      if (value === undefined || value === null || value === '') {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: `${key} is required when PAYMENT_PROVIDER=orcarail`,
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return parsed.data;
}
