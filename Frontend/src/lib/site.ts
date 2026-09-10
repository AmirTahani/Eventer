export const SITE_URL = 'https://eventer.world';

/** Public inbox for the contact form (mailto). Override with NEXT_PUBLIC_CONTACT_EMAIL. */
export function resolveContactEmail(): string {
  const fromEnv = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  if (fromEnv && fromEnv.includes('@')) return fromEnv;
  return 'hello@eventer.world';
}

export const noIndexRobots = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
} as const;
