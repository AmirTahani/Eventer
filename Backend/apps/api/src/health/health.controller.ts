import {
  Controller,
  Get,
  Header,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { PrismaService } from '@eventer/db';
import { metricsRegistry } from '../observability/metrics';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('health')
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({ description: 'Process is alive' })
  check() {
    return this.health.check([
      async () => ({
        api: { status: 'up' as const },
      }),
    ]);
  }

  @Get('health/ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe — checks database' })
  @ApiOkResponse({ description: 'Service is ready to serve traffic' })
  async ready() {
    return this.health.check([
      async () => {
        try {
          await this.prisma.$queryRaw`SELECT 1`;
          return { database: { status: 'up' as const } };
        } catch {
          throw new ServiceUnavailableException('Database unavailable');
        }
      },
    ]);
  }

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({ summary: 'Basic Prometheus text metrics' })
  metrics(): string {
    return metricsRegistry.render();
  }
}
