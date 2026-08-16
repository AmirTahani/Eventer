import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VouchersModule } from './vouchers/vouchers.module';
import { DjsModule } from './djs/djs.module';
import { LocationsModule } from './locations/locations.module';
import { FilesModule } from './files/files.module';
import { EventsModule } from './events/events.module';
import { RegistrationsModule } from './registrations/registrations.module';

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
  ],
})
export class DomainModule {}
