import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthError, ForbiddenError } from '../lib/errors';
import { verifyAccessToken } from '../lib/security';

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new AuthError());
    return;
  }

  try {
    const token = header.slice(7);
    const payload = verifyAccessToken(token);
    req.user = { id: payload.userId, email: payload.email };
    next();
  } catch {
    next(new AuthError('Invalid or expired token'));
  }
}

export async function loadOrganizationMembership(req: Request, _res: Response, next: NextFunction) {
  const organizationId = req.params.organizationId || req.body.organizationId || req.query.organizationId;
  if (!req.user || typeof organizationId !== 'string') {
    next();
    return;
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: req.user.id,
      },
    },
  });

  if (!membership) {
    next(new ForbiddenError('You are not a member of this organization'));
    return;
  }

  req.membership = {
    organizationId,
    role: membership.role,
  };
  next();
}
