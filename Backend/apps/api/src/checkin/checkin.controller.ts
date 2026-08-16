import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CheckinService,
  CurrentUser,
  JwtAuthGuard,
  Roles,
  RolesGuard,
  type AuthUser,
} from '@eventer/domain';
import { IsString, IsUUID } from 'class-validator';

class ScanDto {
  @IsUUID()
  eventId!: string;

  @IsString()
  qrToken!: string;
}

class ManualDto {
  @IsUUID()
  eventId!: string;

  @IsUUID()
  ticketId!: string;
}

@ApiTags('checkin')
@ApiBearerAuth()
@Controller('checkin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ORGANIZER', 'ADMIN')
export class CheckinController {
  constructor(private readonly checkin: CheckinService) {}

  @Post('scan')
  scan(@CurrentUser() user: AuthUser, @Body() body: ScanDto) {
    return this.checkin.scan(user, body);
  }

  @Post('manual')
  manual(@CurrentUser() user: AuthUser, @Body() body: ManualDto) {
    return this.checkin.manual(user, body);
  }
}
