export type IdCursor = { id: string };

export function encodeCursor(cursor: IdCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function decodeCursor(raw?: string): IdCursor | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, 'base64url').toString('utf8'),
    ) as IdCursor;
    if (!parsed?.id || typeof parsed.id !== 'string') return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}
