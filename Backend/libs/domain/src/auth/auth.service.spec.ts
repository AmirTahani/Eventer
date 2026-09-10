import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { signTelegramLoginPayload } from './telegram-login.util';

describe('AuthService.loginWithTelegram', () => {
  const botToken = '123456:ABC-DEF';

  function build(overrides?: {
    userStatus?: 'APPROVED' | 'PENDING' | 'REJECTED' | 'SUSPENDED';
    botToken?: string | undefined;
  }) {
    const users = {
      upsertFromTelegram: jest.fn().mockResolvedValue({
        id: 'u1',
        telegramUserId: 42n,
        firstName: 'Amir',
        status: overrides?.userStatus ?? 'APPROVED',
        roles: [{ role: 'ADMIN' }],
      }),
      toAuthUser: jest.fn().mockReturnValue({
        id: 'u1',
        telegramUserId: '42',
        firstName: 'Amir',
        lastName: null,
        telegramUsername: null,
        locale: 'en',
        status: overrides?.userStatus ?? 'APPROVED',
        roles: ['ADMIN'],
      }),
    } as unknown as UsersService;

    const jwt = {
      signAsync: jest
        .fn()
        .mockResolvedValueOnce('access')
        .mockResolvedValueOnce('refresh'),
    } as unknown as JwtService;

    const config = {
      get: jest.fn((key: string) => {
        if (key === 'TELEGRAM_BOT_TOKEN') return overrides?.botToken ?? botToken;
        if (key === 'JWT_SECRET') return 'dev-jwt-secret-change-me';
        if (key === 'JWT_EXPIRES_IN') return '15m';
        if (key === 'REFRESH_TOKEN_SECRET') return 'dev-refresh-secret-change-me';
        return undefined;
      }),
    } as unknown as ConfigService;

    return {
      service: new AuthService(users, jwt, config as never),
      users,
      jwt,
    };
  }

  it('rejects when bot token is missing', async () => {
    const { service } = build({ botToken: undefined });
    await expect(
      service.loginWithTelegram({
        id: 1,
        first_name: 'A',
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'x',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects invalid hash', async () => {
    const { service } = build();
    await expect(
      service.loginWithTelegram({
        id: 1,
        first_name: 'A',
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'ff'.repeat(32),
      }),
    ).rejects.toThrow(/Invalid Telegram login hash/);
  });

  it('rejects non-approved users', async () => {
    const { service } = build({ userStatus: 'PENDING' });
    const base = {
      id: 42,
      first_name: 'Amir',
      auth_date: Math.floor(Date.now() / 1000),
    };
    const hash = signTelegramLoginPayload(base, botToken);
    await expect(
      service.loginWithTelegram({ ...base, hash }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('issues access + refresh tokens for approved users', async () => {
    const { service, jwt } = build();
    const base = {
      id: 42,
      first_name: 'Amir',
      auth_date: Math.floor(Date.now() / 1000),
    };
    const hash = signTelegramLoginPayload(base, botToken);
    const result = await service.loginWithTelegram({ ...base, hash });
    expect(result.accessToken).toBe('access');
    expect(result.refreshToken).toBe('refresh');
    expect(result.user.firstName).toBe('Amir');
    expect(jwt.signAsync).toHaveBeenCalledTimes(2);
  });
});
