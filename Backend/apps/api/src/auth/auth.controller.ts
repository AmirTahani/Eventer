import { Controller, Post, Body, Res, HttpCode } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from '@eventer/domain';
import { TelegramLoginDto } from './dto/telegram-login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('telegram-login')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Issues JWT access token + refresh cookie' })
  async telegramLogin(
    @Body() body: TelegramLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.loginWithTelegram(body);
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }
}
