import { Module } from '@nestjs/common';
import { CommonModule } from '@eventer/common';
import { DbModule } from '@eventer/db';
import { DomainModule } from '@eventer/domain';
import { AuthController } from './auth/auth.controller';
import { DjsController } from './djs/djs.controller';
import { FilesController } from './files/files.controller';
import { HealthModule } from './health/health.module';
import { LocationsController } from './locations/locations.controller';
import { UsersController } from './users/users.controller';
import { VouchersController } from './vouchers/vouchers.controller';

@Module({
  imports: [CommonModule, DbModule, DomainModule, HealthModule],
  controllers: [
    AuthController,
    UsersController,
    VouchersController,
    DjsController,
    LocationsController,
    FilesController,
  ],
})
export class AppModule {}
