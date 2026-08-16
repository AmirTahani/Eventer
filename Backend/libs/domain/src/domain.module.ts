import { Module } from '@nestjs/common';

/**
 * Shared application services live here (events, registrations, etc.).
 * Apps (api/bot/worker) stay thin entrypoints over this library.
 */
@Module({})
export class DomainModule {}
