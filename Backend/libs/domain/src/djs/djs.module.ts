import { Module } from '@nestjs/common';
import { DjsService } from './djs.service';

@Module({
  providers: [DjsService],
  exports: [DjsService],
})
export class DjsModule {}
