import type { AuthUser } from './auth';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  accessToken?: string | null;
  signal?: AbortSignal;
};

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? (options.body !== undefined ? 'POST' : 'GET'),
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
    cache: 'no-store',
  });

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    const message =
      typeof parsed === 'object' &&
      parsed &&
      'message' in parsed &&
      (parsed as { message: unknown }).message != null
        ? Array.isArray((parsed as { message: unknown }).message)
          ? ((parsed as { message: string[] }).message.join(', '))
          : String((parsed as { message: unknown }).message)
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status, parsed);
  }

  return parsed as T;
}

export async function fetchHealth(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>('/health');
}

export type TelegramLoginPayload = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export async function loginWithTelegram(
  payload: TelegramLoginPayload,
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/telegram-login', { body: payload });
}

export type CreateInvitationInput = {
  invitedTelegramUsername?: string;
};

export type CreateInvitationResult = {
  id: string;
  token: string;
  deepLink: string;
  status: string;
  createdAt: string;
};

export async function createInvitation(
  accessToken: string,
  input: CreateInvitationInput = {},
): Promise<CreateInvitationResult> {
  const body =
    input.invitedTelegramUsername?.trim()
      ? { invitedTelegramUsername: input.invitedTelegramUsername.trim() }
      : {};
  return apiFetch<CreateInvitationResult>('/vouchers/invitations', {
    accessToken,
    body,
  });
}
