import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { Env } from '@eventer/common';
import { RateLimitGuard } from '../common/rate-limit.guard';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { BotServiceGuard } from './bot-service.guard';
import { JwtStrategy } from './jwt.strategy';
import { PoliciesService } from './policies.service';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN', { infer: true }),
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    PoliciesService,
    RolesGuard,
    BotServiceGuard,
    RateLimitGuard,
  ],
  exports: [
    AuthService,
    PoliciesService,
    RolesGuard,
    BotServiceGuard,
    RateLimitGuard,
    JwtModule,
    PassportModule,
    UsersModule,
  ],
})
export class AuthModule {}
