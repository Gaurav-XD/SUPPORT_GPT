import { Router } from 'express';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../lib/async-handler';
import { NotFoundError } from '../lib/errors';
import { authenticate, loadOrganizationMembership } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { publicAgent } from './shared';

export const agentRouter = Router({ mergeParams: true });

const agentSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  systemPrompt: z.string().min(10),
  knowledgeBaseId: z.string().uuid().optional(),
  model: z.string().min(1).default('gpt-4.1-mini'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(64).max(8000).default(1500),
});

agentRouter.use(authenticate, loadOrganizationMembership);

agentRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const agents = await prisma.agent.findMany({
      where: { organizationId: req.params.organizationId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: agents.map(publicAgent) });
  }),
);

agentRouter.post(
  '/',
  requireRole(Role.ADMIN, Role.MANAGER),
  validate(agentSchema),
  asyncHandler(async (req, res) => {
    const agent = await prisma.agent.create({
      data: {
        organizationId: req.params.organizationId,
        createdById: req.user!.id,
        ...req.body,
      },
    });
    res.status(201).json({ success: true, data: publicAgent(agent) });
  }),
);

agentRouter.get(
  '/:agentId',
  asyncHandler(async (req, res) => {
    const agent = await prisma.agent.findFirst({
      where: {
        id: req.params.agentId,
        organizationId: req.params.organizationId,
      },
      include: { knowledgeBase: true },
    });
    if (!agent) {
      throw new NotFoundError('Agent not found');
    }
    res.json({ success: true, data: agent });
  }),
);

agentRouter.patch(
  '/:agentId',
  requireRole(Role.ADMIN, Role.MANAGER),
  validate(agentSchema.partial()),
  asyncHandler(async (req, res) => {
    const agent = await prisma.agent.update({
      where: { id: req.params.agentId },
      data: req.body,
    });
    res.json({ success: true, data: publicAgent(agent) });
  }),
);

agentRouter.delete(
  '/:agentId',
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    await prisma.agent.delete({ where: { id: req.params.agentId } });
    res.status(204).send();
  }),
);
