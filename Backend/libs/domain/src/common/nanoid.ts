import { randomBytes } from 'node:crypto';

const ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * URL-safe nanoid-style token (crypto-backed). Avoids ESM-only `nanoid` package
 * friction under Nest webpack + Jest CommonJS.
 */
export function nanoid(size = 10): string {
  const bytes = randomBytes(size);
  let id = '';
  for (let i = 0; i < size; i++) {
    id += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return id;
}
