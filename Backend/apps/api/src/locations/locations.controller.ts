import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  JwtAuthGuard,
  LocationsService,
  Roles,
  RolesGuard,
  type AuthUser,
} from '@eventer/domain';
import { ListQueryDto } from '../common/list-query.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@ApiTags('locations')
@ApiBearerAuth()
@Controller('locations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Post()
  @Roles('ORGANIZER', 'ADMIN')
  create(@CurrentUser() user: AuthUser, @Body() body: CreateLocationDto) {
    return this.locations.create(user, body);
  }

  @Get()
  @Roles('ORGANIZER', 'ADMIN')
  list(@Query() query: ListQueryDto) {
    return this.locations.list(query);
  }

  @Get(':id')
  @Roles('ORGANIZER', 'ADMIN')
  get(@Param('id') id: string) {
    return this.locations.get(id);
  }

  @Patch(':id')
  @Roles('ORGANIZER', 'ADMIN')
  update(@Param('id') id: string, @Body() body: UpdateLocationDto) {
    return this.locations.update(id, body);
  }

  @Delete(':id')
  @Roles('ORGANIZER', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.locations.softDelete(id);
  }
}
