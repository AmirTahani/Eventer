import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  EventsService,
  JwtAuthGuard,
  RegistrationsService,
  Roles,
  RolesGuard,
  type AuthUser,
} from '@eventer/domain';
import { CancelEventDto } from './dto/cancel-event.dto';
import { CreateAccessGrantDto } from './dto/create-access-grant.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { ReplacePricingTiersDto } from './dto/replace-pricing-tiers.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(
    private readonly events: EventsService,
    private readonly registrations: RegistrationsService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListEventsQueryDto) {
    return this.events.list(user, query);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.events.getById(user, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  create(@CurrentUser() user: AuthUser, @Body() body: CreateEventDto) {
    return this.events.create(user, body);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateEventDto,
  ) {
    return this.events.update(user, id, body);
  }

  @Put(':id/pricing-tiers')
  @UseGuards(RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  replaceTiers(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: ReplacePricingTiersDto,
  ) {
    return this.events.replacePricingTiers(user, id, body);
  }

  @Post(':id/publish')
  @UseGuards(RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  publish(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.events.publish(user, id);
  }

  @Post(':id/release-location')
  @UseGuards(RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  releaseLocation(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.events.releaseLocation(user, id);
  }

  @Post(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: CancelEventDto,
  ) {
    return this.events.cancel(user, id, body.reason);
  }

  @Get(':id/access-grants')
  @UseGuards(RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  listGrants(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.events.listAccessGrants(user, id);
  }

  @Post(':id/access-grants')
  @UseGuards(RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  addGrant(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: CreateAccessGrantDto,
  ) {
    return this.events.addAccessGrant(user, id, body);
  }

  @Delete(':id/access-grants/:grantId')
  @UseGuards(RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  removeGrant(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('grantId') grantId: string,
  ) {
    return this.events.removeAccessGrant(user, id, grantId);
  }

  @Post(':id/registrations')
  createRegistration(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: CreateRegistrationDto,
  ) {
    return this.registrations.create(user, id, body);
  }
}
