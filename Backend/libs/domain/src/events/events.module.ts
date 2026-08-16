import { Module, forwardRef } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { DjsModule } from '../djs/djs.module';
import { FilesModule } from '../files/files.module';
import { LocationsModule } from '../locations/locations.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WaitlistModule } from '../waitlist/waitlist.module';
import { EventVisibilityService } from './event-visibility.service';
import { EventsService } from './events.service';

@Module({
  imports: [
    AuditModule,
    DjsModule,
    LocationsModule,
    FilesModule,
    NotificationsModule,
    forwardRef(() => WaitlistModule),
  ],
  providers: [EventsService, EventVisibilityService],
  exports: [EventsService, EventVisibilityService],
})
export class EventsModule {}
