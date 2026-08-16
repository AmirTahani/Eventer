import { Module } from '@nestjs/common';
import { CommonModule } from '@eventer/common';
import { DbModule } from '@eventer/db';
import { DomainModule } from '@eventer/domain';
import { WorkerJobsService } from './worker-jobs.service';

@Module({
  imports: [CommonModule, DbModule, DomainModule],
  providers: [WorkerJobsService],
})
export class WorkerModule {}
