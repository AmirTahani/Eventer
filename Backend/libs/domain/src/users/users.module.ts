import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { UsersService } from './users.service';

@Module({
  imports: [AuditModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
