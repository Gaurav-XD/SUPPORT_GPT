import { Router } from 'express';
import { Role, UserStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../lib/async-handler';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../lib/errors';
import { authenticate, loadOrganizationMembership } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import {
  publicMember,
  publicOrganization,
  publicUser,
} from './shared';
import { generateInviteToken, hashToken } from '../lib/security';
import { env } from '../config/env';

export const organizationRouter = Router();

const organizationSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
});

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(Role),
});

organizationRouter.use(authenticate);

organizationRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const memberships = await prisma.organizationMember.findMany({
      where: { userId: req.user.id },
      include: { organization: true },
    });

    res.json({
      success: true,
      data: memberships.map((membership) => ({
        organization: publicOrganization(membership.organization),
        role: membership.role,
      })),
    });
  }),
);

organizationRouter.post(
  '/',
  validate(organizationSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const { name, slug, description } = req.body as z.infer<typeof organizationSchema>;
    const existing = await prisma.organization.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictError('Organization slug is already in use');
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        slug,
        description,
        ownerId: req.user.id,
        memberships: {
          create: {
            userId: req.user.id,
            role: Role.ADMIN,
          },
        },
      },
    });

    res.status(201).json({ success: true, data: publicOrganization(organization) });
  }),
);

organizationRouter.get(
  '/:organizationId',
  loadOrganizationMembership,
  asyncHandler(async (req, res) => {
    const organization = await prisma.organization.findUnique({
      where: { id: req.params.organizationId },
      include: {
        memberships: { include: { user: true } },
        knowledgeBases: true,
        agents: true,
        tickets: true,
      },
    });

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    res.json({
      success: true,
      data: {
        ...publicOrganization(organization),
        memberCount: organization.memberships.length,
        knowledgeBaseCount: organization.knowledgeBases.length,
        agentCount: organization.agents.length,
        openTicketCount: organization.tickets.filter((ticket) => ticket.status === 'OPEN').length,
        members: organization.memberships.map(publicMember),
      },
    });
  }),
);

organizationRouter.patch(
  '/:organizationId',
  loadOrganizationMembership,
  requireRole(Role.ADMIN),
  validate(organizationSchema.partial()),
  asyncHandler(async (req, res) => {
    const organization = await prisma.organization.update({
      where: { id: req.params.organizationId },
      data: req.body,
    });

    res.json({ success: true, data: publicOrganization(organization) });
  }),
);

organizationRouter.delete(
  '/:organizationId',
  loadOrganizationMembership,
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    await prisma.organization.delete({ where: { id: req.params.organizationId } });
    res.status(204).send();
  }),
);

organizationRouter.post(
  '/:organizationId/invites',
  loadOrganizationMembership,
  requireRole(Role.ADMIN, Role.MANAGER),
  validate(inviteSchema),
  asyncHandler(async (req, res) => {
    const organizationId = req.params.organizationId as string;
    const { email, role } = req.body as z.infer<typeof inviteSchema>;
    const token = generateInviteToken();
    const invite = await prisma.organizationInvite.create({
      data: {
        organizationId,
        email,
        role,
        token: hashToken(token),
        invitedById: req.user!.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        token,
        expiresAt: invite.expiresAt,
      },
    });
  }),
);

organizationRouter.post(
  '/:organizationId/invites/:token/accept',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const organizationId = req.params.organizationId as string;
    const inviteToken = req.params.token as string;
    const invite = await prisma.organizationInvite.findFirst({
      where: {
        organizationId,
        token: hashToken(inviteToken),
      },
    });

    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      throw new NotFoundError('Invite not found');
    }

    if (invite.email.toLowerCase() !== req.user.email.toLowerCase()) {
      throw new ForbiddenError('This invite is for a different email address');
    }

    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: invite.organizationId,
          userId: req.user.id,
        },
      },
      update: { role: invite.role, status: UserStatus.ACTIVE },
      create: {
        organizationId: invite.organizationId,
        userId: req.user.id,
        role: invite.role,
        status: UserStatus.ACTIVE,
      },
    });

    await prisma.organizationInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    res.status(201).json({ success: true, message: 'Invitation accepted' });
  }),
);

organizationRouter.get(
  '/:organizationId/members',
  loadOrganizationMembership,
  asyncHandler(async (req, res) => {
    const organizationId = req.params.organizationId as string;
    const members = await prisma.organizationMember.findMany({
      where: { organizationId },
      include: { user: true },
      orderBy: { joinedAt: 'asc' },
    });

    res.json({
      success: true,
      data: members.map(publicMember),
    });
  }),
);
