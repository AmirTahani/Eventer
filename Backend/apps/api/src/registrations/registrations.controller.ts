import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  JwtAuthGuard,
  RegistrationsService,
  Roles,
  RolesGuard,
  type AuthUser,
} from '@eventer/domain';
import { CapacityRequestDto } from './dto/capacity-request.dto';
import { RejectRegistrationDto } from './dto/reject-registration.dto';

@ApiTags('registrations')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class RegistrationsController {
  constructor(private readonly registrations: RegistrationsService) {}

  @Post('registrations/:id/approve')
  @UseGuards(RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  approve(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.registrations.approve(user, id);
  }

  @Post('registrations/:id/reject')
  @UseGuards(RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: RejectRegistrationDto,
  ) {
    return this.registrations.reject(user, id, body.reason);
  }

  @Post('registrations/:id/capacity-requests')
  requestCapacity(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: CapacityRequestDto,
  ) {
    return this.registrations.requestCapacityOverride(user, id, body);
  }

  @Post('capacity-requests/:id/approve')
  approveCapacity(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.registrations.approveCapacityOverride(user, id);
  }

  @Post('registrations/:id/cancel')
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.registrations.cancel(user, id);
  }
}
