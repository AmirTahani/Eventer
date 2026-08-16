import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  BotServiceGuard,
  CurrentUser,
  InvitationsService,
  JwtAuthGuard,
  Roles,
  RolesGuard,
  type AuthUser,
} from '@eventer/domain';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';

@ApiTags('vouchers')
@Controller('vouchers')
export class VouchersController {
  constructor(private readonly invitations: InvitationsService) {}

  @Post('invitations')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VOUCHER', 'ADMIN')
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateInvitationDto,
  ) {
    return this.invitations.create(user, body);
  }

  @Post('invitations/:token/accept')
  @UseGuards(BotServiceGuard)
  accept(
    @Param('token') token: string,
    @Body() body: AcceptInvitationDto,
  ) {
    return this.invitations.accept(token, body);
  }
}
