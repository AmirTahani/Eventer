import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { CommonModule } from '@eventer/common';
import { DbModule } from '@eventer/db';
import { DomainModule } from '@eventer/domain';

@Module({
  imports: [CommonModule, DbModule, DomainModule],
})
export class BotModule implements OnModuleInit {
  private readonly logger = new Logger(BotModule.name);

  onModuleInit(): void {
    this.logger.log('Bot process scaffolded — Telegram wiring arrives in M3/M12');
  }
}
