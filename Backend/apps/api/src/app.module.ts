import { Module } from '@nestjs/common';
import { CommonModule } from '@eventer/common';
import { DbModule } from '@eventer/db';
import { DomainModule } from '@eventer/domain';
import { AuditController } from './audit/audit.controller';
import { AuthController } from './auth/auth.controller';
import { CheckinController } from './checkin/checkin.controller';
import { DjsController } from './djs/djs.controller';
import { EventsController } from './events/events.controller';
import { FilesController } from './files/files.controller';
import { HealthModule } from './health/health.module';
import { LocationsController } from './locations/locations.controller';
import { PaymentsController } from './payments/payments.controller';
import { RegistrationsController } from './registrations/registrations.controller';
import { TicketsController } from './tickets/tickets.controller';
import { UsersController } from './users/users.controller';
import { VouchersController } from './vouchers/vouchers.controller';
import { WaitlistController } from './waitlist/waitlist.controller';

@Module({
  imports: [CommonModule, DbModule, DomainModule, HealthModule],
  controllers: [
    AuthController,
    UsersController,
    VouchersController,
    DjsController,
    LocationsController,
    FilesController,
    EventsController,
    RegistrationsController,
    WaitlistController,
    PaymentsController,
    TicketsController,
    CheckinController,
    AuditController,
  ],
})
export class AppModule {}
