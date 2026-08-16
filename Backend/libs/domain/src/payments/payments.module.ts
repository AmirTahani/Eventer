import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { TicketsModule } from '../tickets/tickets.module';
import { WaitlistModule } from '../waitlist/waitlist.module';
import { PaymentsService } from './payments.service';

@Module({
  imports: [NotificationsModule, TicketsModule, WaitlistModule],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
