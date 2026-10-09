import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse: any = exception.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        if (exceptionResponse.message && Array.isArray(exceptionResponse.message)) {
          // class-validator errors
          code = 'VALIDATION_ERROR';
          message = 'Validation failed';
          details = exceptionResponse.message;
        } else {
          code = exceptionResponse.code || exceptionResponse.error || code;
          message = exceptionResponse.message || message;
        }
      } else {
        message = exceptionResponse;
      }
    } else if (exception instanceof QueryFailedError) {
      // Postgres error codes
      const pgError = exception as any;
      if (pgError.code === '23505') {
        status = HttpStatus.CONFLICT;
        code = pgError.constraint?.includes('attendee_email') ? 'ALREADY_REGISTERED' : 'CONFLICT';
        if (pgError.constraint?.includes('workshops_code_key')) code = 'CODE_TAKEN';
        if (pgError.constraint?.includes('users_email_key')) code = 'EMAIL_TAKEN';
        message = 'Conflict: Duplicate record';
      } else if (pgError.code === '23503') {
        status = HttpStatus.CONFLICT;
        code = 'FOREIGN_KEY_VIOLATION';
        message = 'Foreign key constraint violation';
      } else if (pgError.code === '23514') {
        status = HttpStatus.BAD_REQUEST;
        code = 'CHECK_CONSTRAINT_VIOLATION';
        message = 'Check constraint violation';
      }
    }

    response.status(status).json({
      statusCode: status,
      code,
      message,
      details,
    });
  }
}
