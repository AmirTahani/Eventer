import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VouchersModule } from './vouchers/vouchers.module';
import { DjsModule } from './djs/djs.module';
import { LocationsModule } from './locations/locations.module';
import { FilesModule } from './files/files.module';
import { EventsModule } from './events/events.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { PaymentsModule } from './payments/payments.module';
import { TicketsModule } from './tickets/tickets.module';
import { CheckinModule } from './checkin/checkin.module';
import { AuditModule } from './audit/audit.module';
import { RemindersModule } from './reminders/reminders.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    VouchersModule,
    DjsModule,
    LocationsModule,
    FilesModule,
    EventsModule,
    RegistrationsModule,
    NotificationsModule,
    WaitlistModule,
    PaymentsModule,
    TicketsModule,
    CheckinModule,
    AuditModule,
    RemindersModule,
  ],
  exports: [
    AuthModule,
    UsersModule,
    VouchersModule,
    DjsModule,
    LocationsModule,
    FilesModule,
    EventsModule,
    RegistrationsModule,
    NotificationsModule,
    WaitlistModule,
    PaymentsModule,
    TicketsModule,
    CheckinModule,
    AuditModule,
    RemindersModule,
  ],
})
export class DomainModule {}
