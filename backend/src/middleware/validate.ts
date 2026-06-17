import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { ValidationError } from '../lib/errors';

export function validate(schema: ZodTypeAny, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(new ValidationError('Validation failed', result.error.flatten()));
      return;
    }
    req[source] = result.data;
    next();
  };
}
