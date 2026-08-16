import { Module } from '@nestjs/common';
import { DjsModule } from '../djs/djs.module';
import { FilesModule } from '../files/files.module';
import { LocationsModule } from '../locations/locations.module';
import { EventVisibilityService } from './event-visibility.service';
import { EventsService } from './events.service';

@Module({
  imports: [DjsModule, LocationsModule, FilesModule],
  providers: [EventsService, EventVisibilityService],
  exports: [EventsService, EventVisibilityService],
})
export class EventsModule {}
