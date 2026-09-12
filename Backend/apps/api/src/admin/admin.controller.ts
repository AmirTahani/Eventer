import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AdminService,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '@eventer/domain';
import { AdminListQueryDto } from './dto/admin-list-query.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('overview')
  overview() {
    return this.admin.overview();
  }

  @Get('users')
  listUsers(@Query() query: AdminListQueryDto) {
    return this.admin.listUsers(query);
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    const user = await this.admin.getUser(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @Get('events')
  listEvents(@Query() query: AdminListQueryDto) {
    return this.admin.listEvents(query);
  }

  @Get('events/:id')
  async getEvent(@Param('id') id: string) {
    const event = await this.admin.getEvent(id);
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  @Get('payments')
  listPayments(@Query() query: AdminListQueryDto) {
    return this.admin.listPayments(query);
  }

  @Get('registrations')
  listRegistrations(@Query() query: AdminListQueryDto) {
    return this.admin.listRegistrations(query);
  }

  @Get('tickets')
  listTickets(@Query() query: AdminListQueryDto) {
    return this.admin.listTickets(query);
  }

  @Get('audit-logs')
  listAuditLogs(@Query() query: AdminListQueryDto) {
    return this.admin.listAuditLogs(query);
  }
}
