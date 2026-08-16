import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, createInvitation } from './api';

describe('createInvitation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs to /vouchers/invitations with bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          id: 'inv-1',
          token: 'abc',
          deepLink: 'https://t.me/EventBot?start=invite_abc',
          status: 'PENDING',
          createdAt: '2026-01-01T00:00:00.000Z',
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await createInvitation('jwt-token', {
      invitedTelegramUsername: 'guest',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/vouchers\/invitations$/),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-token',
        }),
        body: JSON.stringify({ invitedTelegramUsername: 'guest' }),
      }),
    );
    expect(result.deepLink).toContain('invite_abc');
  });

  it('throws ApiError on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => JSON.stringify({ message: 'Forbidden' }),
      }),
    );

    await expect(createInvitation('jwt', {})).rejects.toBeInstanceOf(ApiError);
  });
});
