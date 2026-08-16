import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Env } from '@eventer/common';
import { AuthService } from './auth.service';
import { AuthUser } from './policies';

type JwtPayload = { sub: string; typ?: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService<Env, true>,
    private readonly auth: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET', { infer: true }),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (payload.typ === 'refresh') {
      throw new Error('Refresh token cannot be used as access token');
    }
    // Roles always re-derived from DB (never trusted from token claims).
    return this.auth.loadAuthUser(payload.sub);
  }
}
