import { Module } from '@nestjs/common';
import { CommonModule } from '@eventer/common';
import { DbModule } from '@eventer/db';
import { DomainModule } from '@eventer/domain';
import { TelegramBotService } from './telegram-bot.service';

@Module({
  imports: [CommonModule, DbModule, DomainModule],
  providers: [TelegramBotService],
})
export class BotModule {}
