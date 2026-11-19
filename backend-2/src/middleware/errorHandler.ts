import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // 1. Handled Application Errors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`Application error: ${err.message}`, err);
    } else {
      logger.warn(`Application notice: ${err.message} (${err.code})`);
    }

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      detail: err.message,
    });
    return;
  }

  // 2. Zod Validation Errors
  if (err instanceof ZodError) {
    logger.warn('Request validation error', err.errors);
    const detailMsg = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');

    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Input validation failed',
        details: err.errors,
      },
      detail: detailMsg || 'Input validation failed',
    });
    return;
  }

  // 3. PostgreSQL Specific Database Errors
  const pgErr = err as { code?: string; detail?: string; message?: string };
  if (pgErr && typeof pgErr.code === 'string') {
    // 23505: Unique violation
    if (pgErr.code === '23505') {
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT_ERROR',
          message: 'Resource already exists or constraint violated',
          details: pgErr.detail,
        },
        detail: pgErr.detail || 'Unique constraint violation',
      });
      return;
    }

    // 23503: Foreign key violation
    if (pgErr.code === '23503') {
      res.status(400).json({
        success: false,
        error: {
          code: 'FOREIGN_KEY_VIOLATION',
          message: 'Referenced entity does not exist',
          details: pgErr.detail,
        },
        detail: pgErr.detail || 'Foreign key violation',
      });
      return;
    }
  }

  // 4. Fallback for unhandled internal server errors
  logger.error('Unhandled server exception:', err);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred',
    },
    detail: 'An unexpected internal server error occurred',
  });
}
