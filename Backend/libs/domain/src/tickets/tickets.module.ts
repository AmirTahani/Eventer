import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';

@Module({
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
