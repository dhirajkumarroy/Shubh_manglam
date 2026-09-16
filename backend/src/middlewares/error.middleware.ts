import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../common/utils/app-error';
import { ResponseDto } from '../common/dto/api-response.dto';
import logger from '../config/logger';
import { env } from '../config/env';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any = null;

  const reqId = (req as any).id || 'N/A';

  // Log error
  logger.error(`[Request ID: ${reqId}] ${err.name}: ${err.message}\nStack: ${err.stack}`);

  // Handle custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  }
  // Handle Zod Schema validation errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.errors.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  }
  // Handle Prisma Database Engine errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        statusCode = 409;
        const target = (err.meta?.target as string[]) || [];
        message = `Unique constraint failed on field: ${target.join(', ')}`;
        break;
      }
      case 'P2025': {
        statusCode = 404;
        message = 'Record to update or delete was not found.';
        break;
      }
      case 'P2003': {
        statusCode = 400;
        message = 'Foreign key constraint failed.';
        break;
      }
      default: {
        statusCode = 400;
        message = `Database error: ${err.message}`;
      }
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Database validation failed.';
  }

  // Response formatting
  const response = ResponseDto.error(message, errors);
  
  // Attach stack trace only in development
  if (env.NODE_ENV === 'development') {
    (response as any).stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorMiddleware;
