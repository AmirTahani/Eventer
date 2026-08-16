import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VouchersModule } from './vouchers/vouchers.module';

@Module({
  imports: [AuthModule, UsersModule, VouchersModule],
  exports: [AuthModule, UsersModule, VouchersModule],
})
export class DomainModule {}
