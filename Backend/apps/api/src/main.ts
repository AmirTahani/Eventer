import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { Env } from '@eventer/common';
import { AppModule } from './app.module';
import {
  initSentryStub,
  StructuredLogger,
} from './observability/structured-logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new StructuredLogger('API'),
    // Required so payment webhook HMAC verifies the exact bytes received
    rawBody: true,
  });
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = app.get(ConfigService<Env, true>);
  initSentryStub(config.get('SENTRY_DSN', { infer: true }));

  const corsOrigin = config.get('CORS_ORIGIN', { infer: true });
  app.enableCors({ origin: corsOrigin, credentials: true });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Eventer API')
    .setDescription('Private event management platform API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const { writeFileSync, mkdirSync } = await import('node:fs');
  const { join } = await import('node:path');
  const outDir = join(process.cwd(), 'openapi');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'openapi.json'), JSON.stringify(document, null, 2));

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
}

void bootstrap();
