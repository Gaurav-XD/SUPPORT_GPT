import { Router } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../lib/async-handler';
import { authenticate, loadOrganizationMembership } from '../middleware/auth';

export const analyticsRouter = Router({ mergeParams: true });

analyticsRouter.use(authenticate, loadOrganizationMembership);

analyticsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const organizationId = req.params.organizationId;
    const [conversations, tickets, documents, agents, members, messages] = await Promise.all([
      prisma.conversation.count({ where: { organizationId } }),
      prisma.ticket.findMany({ where: { organizationId } }),
      prisma.document.count({ where: { organizationId } }),
      prisma.agent.count({ where: { organizationId } }),
      prisma.organizationMember.count({ where: { organizationId } }),
      prisma.message.count({
        where: {
          conversation: { organizationId },
        },
      }),
    ]);

    const resolved = tickets.filter((ticket) => ticket.status === 'RESOLVED' || ticket.status === 'CLOSED').length;
    const escalated = tickets.filter((ticket) => ticket.status === 'ESCALATED').length;

    res.json({
      success: true,
      data: {
        summary: {
          conversations,
          messages,
          tickets: tickets.length,
          resolutionRate: tickets.length ? resolved / tickets.length : 0,
          escalationRate: tickets.length ? escalated / tickets.length : 0,
          documents,
          agents,
          members,
        },
        ticketBreakdown: tickets.reduce<Record<string, number>>((accumulator, ticket) => {
          accumulator[ticket.status] = (accumulator[ticket.status] || 0) + 1;
          return accumulator;
        }, {}),
      },
    });
  }),
);
