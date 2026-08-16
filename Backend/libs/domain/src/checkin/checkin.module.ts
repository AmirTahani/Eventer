import { Module } from '@nestjs/common';
import { TicketsModule } from '../tickets/tickets.module';
import { CheckinService } from './checkin.service';

@Module({
  imports: [TicketsModule],
  providers: [CheckinService],
  exports: [CheckinService],
})
export class CheckinModule {}
