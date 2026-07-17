import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : { message: exception.message || 'Internal server error' };

    const structuredMessage = typeof message === 'string' ? { message } : (message as any);

    response.status(status).json({
      statusCode: status,
      ...structuredMessage,
      timestamp: new Date().toISOString(),
    });
  }
}