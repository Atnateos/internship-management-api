import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: Record<string, unknown> = { message: 'Internal server error' };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      body =
        typeof res === 'string'
          ? { message: res }
          : (res as Record<string, unknown>);
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Known, expected database error codes get a clean, specific response.
      // Anything else falls through to a generic 400 rather than exposing
      // raw Prisma internals to the client.
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          body = { message: 'A record with this value already exists' };
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          body = { message: 'Record not found' };
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          body = { message: 'Invalid database request' };
      }
    } else if (exception instanceof Error) {
      // Never send raw internal error messages to the client. Log the real
      // details server-side for debugging instead.
      this.logger.error(exception.message, exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      ...body,
      timestamp: new Date().toISOString(),
    });
  }
}
