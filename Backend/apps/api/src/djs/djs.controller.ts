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
  DjsService,
  JwtAuthGuard,
  Roles,
  RolesGuard,
  type AuthUser,
} from '@eventer/domain';
import { CreateDjDto } from './dto/create-dj.dto';
import { UpdateDjDto } from './dto/update-dj.dto';
import { ListQueryDto } from '../common/list-query.dto';

@ApiTags('djs')
@ApiBearerAuth()
@Controller('djs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DjsController {
  constructor(private readonly djs: DjsService) {}

  @Post()
  @Roles('ORGANIZER', 'ADMIN')
  create(@CurrentUser() user: AuthUser, @Body() body: CreateDjDto) {
    return this.djs.create(user, body);
  }

  @Get()
  @Roles('ORGANIZER', 'ADMIN')
  list(@Query() query: ListQueryDto) {
    return this.djs.list(query);
  }

  @Get(':id')
  @Roles('ORGANIZER', 'ADMIN')
  get(@Param('id') id: string) {
    return this.djs.get(id);
  }

  @Patch(':id')
  @Roles('ORGANIZER', 'ADMIN')
  update(@Param('id') id: string, @Body() body: UpdateDjDto) {
    return this.djs.update(id, body);
  }

  @Delete(':id')
  @Roles('ORGANIZER', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.djs.softDelete(id);
  }
}
