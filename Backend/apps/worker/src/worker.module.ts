import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { CommonModule } from '@eventer/common';
import { DbModule } from '@eventer/db';
import { DomainModule } from '@eventer/domain';

@Module({
  imports: [CommonModule, DbModule, DomainModule],
})
export class WorkerModule implements OnModuleInit {
  private readonly logger = new Logger(WorkerModule.name);

  onModuleInit(): void {
    this.logger.log(
      'Worker process scaffolded — BullMQ processors arrive in M8/M9/M11',
    );
  }
}
