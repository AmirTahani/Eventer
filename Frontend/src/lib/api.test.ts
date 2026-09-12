import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  apiFetch,
  createInvitation,
  fetchHealth,
  fetchPublicConfig,
  getApiBaseUrl,
  loginWithTelegram,
} from './api';

describe('getApiBaseUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps eventer.world hosts to the production API', () => {
    vi.stubGlobal('window', {
      location: { hostname: 'eventer.world' },
    });
    expect(getApiBaseUrl()).toBe('https://api.eventer.world');

    vi.stubGlobal('window', {
      location: { hostname: 'app.eventer.world' },
    });
    expect(getApiBaseUrl()).toBe('https://api.eventer.world');

    vi.stubGlobal('window', {
      location: { hostname: 'admin.eventer.world' },
    });
    expect(getApiBaseUrl()).toBe('https://api.eventer.world');
  });

  it('falls back to NEXT_PUBLIC_API_BASE_URL on localhost', () => {
    vi.stubGlobal('window', {
      location: { hostname: 'localhost' },
    });
    expect(getApiBaseUrl()).toMatch(/localhost:4001|http/);
  });
});

describe('apiFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('joins array error messages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () =>
          JSON.stringify({ message: ['id must be a number', 'hash required'] }),
      }),
    );

    await expect(apiFetch('/x')).rejects.toMatchObject({
      message: 'id must be a number, hash required',
      status: 400,
    });
  });

  it('uses status fallback when body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        text: async () => 'bad gateway',
      }),
    );

    await expect(apiFetch('/x')).rejects.toMatchObject({
      message: 'Request failed (502)',
      status: 502,
    });
  });

  it('POSTs JSON bodies by default when body is set', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ status: 'ok' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/health', { body: { ping: true } });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/health$/),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ ping: true }),
      }),
    );
  });
});

describe('auth + config helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loginWithTelegram posts the widget payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          accessToken: 'jwt',
          user: {
            id: 'u1',
            telegramUserId: '42',
            firstName: 'Amir',
            status: 'APPROVED',
            roles: ['ADMIN'],
          },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await loginWithTelegram({
      id: 42,
      first_name: 'Amir',
      auth_date: 1,
      hash: 'abc',
    });

    expect(result.accessToken).toBe('jwt');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/telegram-login$/),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          id: 42,
          first_name: 'Amir',
          auth_date: 1,
          hash: 'abc',
        }),
      }),
    );
  });

  it('fetchPublicConfig GETs /config', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({ telegramBotUsername: 'Eventer_advance_bot' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchPublicConfig()).resolves.toEqual({
      telegramBotUsername: 'Eventer_advance_bot',
    });
    expect(fetchMock.mock.calls[0][1].method).toBe('GET');
  });

  it('fetchHealth GETs /health', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ status: 'ok' }),
      }),
    );
    await expect(fetchHealth()).resolves.toEqual({ status: 'ok' });
  });

  it('createInvitation omits empty username', async () => {
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

    await createInvitation('jwt', { invitedTelegramUsername: '  ' });
    expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify({}));
  });

  it('surfaces ApiError name', () => {
    const err = new ApiError('nope', 401, null);
    expect(err.name).toBe('ApiError');
    expect(err).toBeInstanceOf(Error);
  });
});
