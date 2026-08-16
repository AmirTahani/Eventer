import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { BotModule } from './bot.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(BotModule, {
    logger: ['log', 'error', 'warn'],
  });
  app.enableShutdownHooks();
  Logger.log('Bot process started', 'Bootstrap');
}

void bootstrap();
