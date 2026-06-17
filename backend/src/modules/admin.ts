import { Router } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../lib/async-handler';
import { authenticate } from '../middleware/auth';

export const adminRouter = Router();

adminRouter.use(authenticate);

adminRouter.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    const [users, organizations, tickets, conversations, documents] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.ticket.count(),
      prisma.conversation.count(),
      prisma.document.count(),
    ]);

    res.json({
      success: true,
      data: {
        users,
        organizations,
        tickets,
        conversations,
        documents,
      },
    });
  }),
);
