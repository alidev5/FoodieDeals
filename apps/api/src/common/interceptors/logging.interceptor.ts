import type { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { Injectable, Logger } from "@nestjs/common";
import type { Request, Response } from "express";
import { tap } from "rxjs";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - startedAt;
        this.logger.log(`${request.method} ${request.url} ${response.statusCode} ${durationMs}ms`);
      }),
    );
  }
}
