import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../src/lib/security';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hashPassword('SupportGPT123!');
  const user = await prisma.user.upsert({
    where: { email: 'admin@supportgpt.dev' },
    update: {},
    create: {
      email: 'admin@supportgpt.dev',
      firstName: 'Support',
      lastName: 'Admin',
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });

  const organization = await prisma.organization.upsert({
    where: { slug: 'supportgpt' },
    update: {},
    create: {
      name: 'SupportGPT',
      slug: 'supportgpt',
      description: 'Demo organization for the SupportGPT portfolio platform.',
      ownerId: user.id,
      memberships: {
        create: {
          userId: user.id,
          role: Role.ADMIN,
        },
      },
    },
  });

  const knowledgeBase = await prisma.knowledgeBase.create({
    data: {
      organizationId: organization.id,
      name: 'Product Knowledge Base',
      description: 'Starter knowledge base for the SupportGPT demo.',
    },
  });

  const agent = await prisma.agent.create({
    data: {
      organizationId: organization.id,
      knowledgeBaseId: knowledgeBase.id,
      createdById: user.id,
      name: 'Atlas Support Agent',
      description: 'Handles common customer support questions with citations.',
      systemPrompt:
        'You are Atlas, a concise and helpful customer support assistant. Use citations when available.',
    },
  });

  await prisma.conversation.create({
    data: {
      organizationId: organization.id,
      agentId: agent.id,
      userId: user.id,
      title: 'Getting started',
      messages: {
        create: [
          { role: 'user', content: 'How do I reset my password?' },
          {
            role: 'assistant',
            content: 'Open Settings → Security → Reset password.',
            modelUsed: 'gpt-4.1-mini',
            tokensUsed: 72,
            citations: [{ document: 'help-center.pdf', chunk: 1 }],
          },
        ],
      },
    },
  });

  await prisma.ticket.create({
    data: {
      organizationId: organization.id,
      title: 'Billing question from demo account',
      description: 'User needs an invoice copy.',
      priority: 'HIGH',
      createdById: user.id,
      assignedToId: user.id,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
