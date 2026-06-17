import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors';

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, 'Route not found', 'NOT_FOUND'));
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong',
    },
  });
}
