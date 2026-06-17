import { Router } from 'express';
import { Role, TicketPriority, TicketStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../lib/async-handler';
import { NotFoundError } from '../lib/errors';
import { authenticate, loadOrganizationMembership } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';

export const ticketRouter = Router({ mergeParams: true });

const ticketSchema = z.object({
  conversationId: z.string().uuid().optional(),
  title: z.string().min(2),
  description: z.string().optional(),
  priority: z.nativeEnum(TicketPriority).default(TicketPriority.MEDIUM),
});

const ticketUpdateSchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
});

ticketRouter.use(authenticate, loadOrganizationMembership);

ticketRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const tickets = await prisma.ticket.findMany({
      where: { organizationId: req.params.organizationId },
      include: { assignedTo: true, createdBy: true, comments: true },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ success: true, data: tickets });
  }),
);

ticketRouter.post(
  '/',
  requireRole(Role.ADMIN, Role.MANAGER, Role.AGENT),
  validate(ticketSchema),
  asyncHandler(async (req, res) => {
    const organizationId = req.params.organizationId as string;
    const ticket = await prisma.ticket.create({
      data: {
        organizationId,
        createdById: req.user!.id,
        ...req.body,
      },
    });

    res.status(201).json({ success: true, data: ticket });
  }),
);

ticketRouter.get(
  '/:ticketId',
  asyncHandler(async (req, res) => {
    const organizationId = req.params.organizationId as string;
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: req.params.ticketId,
        organizationId,
      },
      include: {
        assignedTo: true,
        createdBy: true,
        conversation: true,
        comments: { include: { author: true }, orderBy: { createdAt: 'asc' } },
        activityLogs: true,
      },
    });

    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    res.json({ success: true, data: ticket });
  }),
);

ticketRouter.patch(
  '/:ticketId',
  requireRole(Role.ADMIN, Role.MANAGER),
  validate(ticketUpdateSchema),
  asyncHandler(async (req, res) => {
    const ticket = await prisma.ticket.update({
      where: { id: req.params.ticketId },
      data: req.body,
    });
    res.json({ success: true, data: ticket });
  }),
);

ticketRouter.post(
  '/:ticketId/comments',
  asyncHandler(async (req, res) => {
    const content = String(req.body?.content || '');
    if (!content) {
      throw new NotFoundError('Comment content is required');
    }

    const ticketId = req.params.ticketId as string;
    const comment = await prisma.ticketComment.create({
      data: {
        ticketId,
        authorId: req.user!.id,
        content,
        isInternal: Boolean(req.body?.isInternal),
      },
    });

    res.status(201).json({ success: true, data: comment });
  }),
);
