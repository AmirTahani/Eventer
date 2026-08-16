import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Env } from '@eventer/common';
import { UsersService } from '../users/users.service';
import {
  TelegramLoginPayload,
  verifyTelegramLoginHash,
} from './telegram-login.util';
import { AuthUser } from './policies';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async loginWithTelegram(payload: TelegramLoginPayload) {
    const botToken = this.config.get('TELEGRAM_BOT_TOKEN', { infer: true });
    if (!botToken) {
      throw new UnauthorizedException('Telegram bot token is not configured');
    }

    const verified = verifyTelegramLoginHash(payload, botToken);
    if (!verified.ok) {
      throw new UnauthorizedException(
        verified.reason === 'expired'
          ? 'Telegram login payload expired'
          : 'Invalid Telegram login hash',
      );
    }

    const user = await this.users.upsertFromTelegram({
      telegramUserId: BigInt(payload.id),
      firstName: payload.first_name,
      lastName: payload.last_name,
      telegramUsername: payload.username,
    });

    if (user.status !== 'APPROVED') {
      throw new ForbiddenException(
        `User status is ${user.status}; only APPROVED users can log in`,
      );
    }

    const authUser = this.users.toAuthUser(user);
    const accessToken = await this.issueAccessToken(authUser);
    const refreshToken = await this.issueRefreshToken(authUser);

    return {
      accessToken,
      refreshToken,
      user: {
        id: authUser.id,
        telegramUserId: authUser.telegramUserId,
        firstName: authUser.firstName,
        status: authUser.status,
        roles: authUser.roles,
      },
    };
  }

  /**
   * Bot / service-account path: resolve acting Telegram user from DB every request.
   */
  async resolveActingTelegramUser(telegramUserId: string): Promise<AuthUser> {
    const user = await this.users.findByTelegramUserId(BigInt(telegramUserId));
    if (!user || user.status !== 'APPROVED') {
      throw new ForbiddenException('Acting Telegram user is not approved');
    }
    return this.users.toAuthUser(user);
  }

  async issueAccessToken(user: AuthUser): Promise<string> {
    return this.jwt.signAsync(
      { sub: user.id },
      {
        secret: this.config.get('JWT_SECRET', { infer: true }),
        expiresIn: this.config.get('JWT_EXPIRES_IN', { infer: true }),
      },
    );
  }

  async issueRefreshToken(user: AuthUser): Promise<string> {
    return this.jwt.signAsync(
      { sub: user.id, typ: 'refresh' },
      {
        secret: this.config.get('REFRESH_TOKEN_SECRET', { infer: true }),
        expiresIn: '30d',
      },
    );
  }

  async loadAuthUser(userId: string): Promise<AuthUser> {
    const user = await this.users.findById(userId);
    if (user.status !== 'APPROVED') {
      throw new ForbiddenException(`User status is ${user.status}`);
    }
    return this.users.toAuthUser(user);
  }
}
