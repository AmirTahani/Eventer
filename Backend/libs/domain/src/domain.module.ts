import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VouchersModule } from './vouchers/vouchers.module';
import { DjsModule } from './djs/djs.module';
import { LocationsModule } from './locations/locations.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    VouchersModule,
    DjsModule,
    LocationsModule,
    FilesModule,
  ],
  exports: [
    AuthModule,
    UsersModule,
    VouchersModule,
    DjsModule,
    LocationsModule,
    FilesModule,
  ],
})
export class DomainModule {}
