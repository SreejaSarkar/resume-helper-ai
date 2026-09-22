import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observatory, type MetricData } from '@sreejasarkar/api-observatory';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

class OptionalObservatory {
  private readonly client: Observatory | null;
  private disabled = false;
  private hasLoggedMissingKey = false;
  private hasLoggedInvalidKey = false;

  constructor() {
    const apiKey = process.env.OBSERVATORY_API_KEY?.trim();

    if (!apiKey) {
      this.client = null;
      return;
    }

    this.client = new Observatory({
      apiKey,
      serverUrl:
        process.env.OBSERVATORY_SERVER_URL ||
        process.env.OBSERVATORY_URL ||
        'http://localhost:3001',
      environment: process.env.NODE_ENV || 'development',
      batchSize: 10,
      flushInterval: 5000,
      timeout: 5000,
      maxRetries: 3,
      maxQueueSize: 1000,
      debug: process.env.NODE_ENV !== 'production',
      onError: (error) => {
        const message = error.message || 'Unknown Observatory error';

        if (/status code 401|status code 403/i.test(message)) {
          this.disabled = true;

          if (!this.hasLoggedInvalidKey) {
            this.hasLoggedInvalidKey = true;
            console.warn(
              '[Observatory] Disabling telemetry because the configured API key was rejected by the observability server.',
            );
          }

          return;
        }

        console.error('[Observatory] Failed to send telemetry:', message);
      },
    });
  }

  private track(metric: MetricData) {
    if (!this.client || this.disabled) {
      if (!this.client && !this.hasLoggedMissingKey) {
        this.hasLoggedMissingKey = true;
        console.log(
          '[Observatory] OBSERVATORY_API_KEY not set. Telemetry is disabled.',
        );
      }

      return;
    }

    this.client.track(metric);
  }

  nest(): NestInterceptor {
    return new (class implements NestInterceptor {
      intercept(
        context: ExecutionContext,
        next: CallHandler,
      ): Observable<unknown> {
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();
        const start = Date.now();
        const userAgent = request.get('user-agent');

        return next.handle().pipe(
          finalize(() => {
            observatory.track({
              endpoint: request.originalUrl,
              method: request.method,
              latency: Date.now() - start,
              statusCode: response.statusCode,
              userAgent,
            });
          }),
        );
      }
    })();
  }

  async shutdown() {
    if (!this.client || this.disabled) {
      return;
    }

    await this.client.shutdown();
  }
}

export const observatory = new OptionalObservatory();
