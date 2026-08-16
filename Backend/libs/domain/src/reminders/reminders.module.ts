import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventRemindersService } from './event-reminders.service';

@Module({
  imports: [NotificationsModule],
  providers: [EventRemindersService],
  exports: [EventRemindersService],
})
export class RemindersModule {}
