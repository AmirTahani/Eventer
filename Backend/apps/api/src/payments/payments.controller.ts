import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  JwtAuthGuard,
  PaymentsService,
  type AuthUser,
} from '@eventer/domain';
import { IsUUID } from 'class-validator';
import type { Request } from 'express';

class CreateIntentDto {
  @IsUUID()
  registrationId!: string;
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('intents')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  createIntent(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateIntentDto,
  ) {
    return this.payments.createIntent(user, body.registrationId);
  }

  @Post('webhook/:provider')
  @HttpCode(200)
  handleWebhook(
    @Param('provider') provider: string,
    @Headers('x-provider-signature') signature: string | undefined,
    @Body() body: unknown,
    @Req() req: Request & { rawBody?: string },
  ) {
    const rawBuf = (req as Request & { rawBody?: Buffer }).rawBody;
    const raw =
      Buffer.isBuffer(rawBuf)
        ? rawBuf.toString('utf8')
        : typeof rawBuf === 'string'
          ? rawBuf
          : JSON.stringify(body);
    return this.payments.handleWebhook(provider, raw, signature, body);
  }
}
