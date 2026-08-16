import { Injectable, LoggerService, LogLevel } from '@nestjs/common';

/**
 * Structured JSON logger wrapper (pino-compatible shape).
 * Use with NestFactory.create(..., { logger: new StructuredLogger() }).
 * Optional Sentry: set SENTRY_DSN — integration is stubbed (logs DSN presence only).
 */
@Injectable()
export class StructuredLogger implements LoggerService {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: unknown, ...optionalParams: unknown[]) {
    this.write('info', message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]) {
    this.write('error', message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]) {
    this.write('warn', message, optionalParams);
  }

  debug?(message: unknown, ...optionalParams: unknown[]) {
    this.write('debug', message, optionalParams);
  }

  verbose?(message: unknown, ...optionalParams: unknown[]) {
    this.write('verbose', message, optionalParams);
  }

  fatal?(message: unknown, ...optionalParams: unknown[]) {
    this.write('fatal', message, optionalParams);
  }

  setLogLevels?(levels: LogLevel[]) {
    void levels;
    // Nest calls this; levels are filtered by Nest itself for default logger.
  }

  private write(level: string, message: unknown, optionalParams: unknown[]) {
    const context =
      typeof optionalParams[optionalParams.length - 1] === 'string'
        ? (optionalParams[optionalParams.length - 1] as string)
        : this.context;
    const payload = {
      level,
      time: new Date().toISOString(),
      context: context ?? undefined,
      msg: typeof message === 'string' ? message : JSON.stringify(message),
    };
    const line = JSON.stringify(payload);
    if (level === 'error' || level === 'fatal') {
      console.error(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else {
      console.log(line);
    }
  }
}

/** Call once at bootstrap if SENTRY_DSN is set (stub — no SDK required for MVP). */
export function initSentryStub(dsn: string | undefined): void {
  if (!dsn) return;
  console.log(
    JSON.stringify({
      level: 'info',
      time: new Date().toISOString(),
      context: 'Sentry',
      msg: 'SENTRY_DSN configured — wire @sentry/node when ready for full error tracking',
    }),
  );
}
