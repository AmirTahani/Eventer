import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  JwtAuthGuard,
  WaitlistService,
  type AuthUser,
} from '@eventer/domain';

@ApiTags('waitlist')
@ApiBearerAuth()
@Controller('waitlist')
@UseGuards(JwtAuthGuard)
export class WaitlistController {
  constructor(private readonly waitlist: WaitlistService) {}

  @Post(':id/claim')
  claim(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.waitlist.claim(user, id);
  }
}
