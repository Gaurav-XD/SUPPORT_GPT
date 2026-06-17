import type { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { ForbiddenError } from '../lib/errors';

export function requireRole(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.membership) {
      next(new ForbiddenError('Organization membership required'));
      return;
    }

    const permitted = allowed.includes(req.membership.role) || req.membership.role === Role.ADMIN;
    if (!permitted) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }

    next();
  };
}
