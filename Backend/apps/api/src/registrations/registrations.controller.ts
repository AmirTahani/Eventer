import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  JwtAuthGuard,
  RegistrationsService,
  type AuthUser,
} from '@eventer/domain';
import { CapacityRequestDto } from './dto/capacity-request.dto';

@ApiTags('registrations')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class RegistrationsController {
  constructor(private readonly registrations: RegistrationsService) {}

  @Post('registrations/:id/capacity-requests')
  requestCapacity(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: CapacityRequestDto,
  ) {
    return this.registrations.requestCapacityOverride(user, id, body);
  }

  @Post('capacity-requests/:id/approve')
  approveCapacity(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.registrations.approveCapacityOverride(user, id);
  }

  @Post('registrations/:id/cancel')
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.registrations.cancel(user, id);
  }
}
