import { Module } from '@nestjs/common';
import { CommonModule } from '@eventer/common';
import { DbModule } from '@eventer/db';
import { DomainModule } from '@eventer/domain';
import { HealthModule } from './health/health.module';

@Module({
  imports: [CommonModule, DbModule, DomainModule, HealthModule],
})
export class AppModule {}
