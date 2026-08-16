import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { WaitlistService } from './waitlist.service';

@Module({
  imports: [NotificationsModule],
  providers: [WaitlistService],
  exports: [WaitlistService],
})
export class WaitlistModule {}
