import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TicketsModule } from '../tickets/tickets.module';
import { CheckinService } from './checkin.service';

@Module({
  imports: [TicketsModule, AuditModule],
  providers: [CheckinService],
  exports: [CheckinService],
})
export class CheckinModule {}
