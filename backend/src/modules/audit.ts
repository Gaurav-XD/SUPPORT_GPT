import { Router } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../lib/async-handler';
import { authenticate, loadOrganizationMembership } from '../middleware/auth';

export const auditRouter = Router({ mergeParams: true });

auditRouter.use(authenticate, loadOrganizationMembership);

auditRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const logs = await prisma.auditLog.findMany({
      where: { organizationId: req.params.organizationId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ success: true, data: logs });
  }),
);
