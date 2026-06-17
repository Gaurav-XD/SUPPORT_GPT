import { Router } from 'express';
import { Role, ConversationStatus, Message as PrismaMessage } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../lib/async-handler';
import { NotFoundError, ValidationError } from '../lib/errors';
import { authenticate, loadOrganizationMembership } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { chunkText, cosineSimilarity, countTokens } from './shared';
import { generateAssistantReply, generateEmbedding } from '../services/ai';

export const chatRouter = Router({ mergeParams: true });

const conversationSchema = z.object({
  agentId: z.string().uuid(),
  title: z.string().min(2).default('New conversation'),
});

const messageSchema = z.object({
  content: z.string().min(1),
  stream: z.boolean().optional().default(false),
});

chatRouter.use(authenticate, loadOrganizationMembership);

chatRouter.post(
  '/conversations',
  validate(conversationSchema),
  asyncHandler(async (req, res) => {
    const { agentId, title } = req.body as z.infer<typeof conversationSchema>;
    const organizationId = req.params.organizationId as string;
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, organizationId },
    });
    if (!agent) {
      throw new NotFoundError('Agent not found');
    }

    const conversation = await prisma.conversation.create({
      data: {
        organizationId,
        agentId,
        userId: req.user?.id,
        title,
      },
    });

    res.status(201).json({ success: true, data: conversation });
  }),
);

chatRouter.get(
  '/conversations/:conversationId',
  asyncHandler(async (req, res) => {
    const organizationId = req.params.organizationId as string;
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: req.params.conversationId,
        organizationId,
      },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        agent: true,
      },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    res.json({ success: true, data: conversation });
  }),
);

chatRouter.post(
  '/conversations/:conversationId/messages',
  validate(messageSchema),
  asyncHandler(async (req, res) => {
    const { content, stream } = req.body as z.infer<typeof messageSchema>;
    const organizationId = req.params.organizationId as string;
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: req.params.conversationId,
        organizationId,
      },
      include: {
        agent: {
          include: {
            knowledgeBase: {
              include: {
                documents: {
                  include: {
                    chunks: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content,
        tokensUsed: countTokens(content),
      },
    });

    const userEmbedding = await generateEmbedding(content);
    const documentChunks = conversation.agent.knowledgeBase?.documents.flatMap((document) => document.chunks) ?? [];
    const scoredChunks = documentChunks
      .map((chunk) => ({
        chunk,
        similarity: cosineSimilarity(
          userEmbedding,
          Array.isArray(chunk.embedding) ? (chunk.embedding as number[]) : [],
        ),
      }))
      .sort((left, right) => right.similarity - left.similarity)
      .slice(0, 4);

    const citations = scoredChunks.map(({ chunk, similarity }) => ({
      documentId: chunk.documentId,
      chunkId: chunk.id,
      quote: chunk.content.slice(0, 280),
      relevanceScore: Number(similarity.toFixed(4)),
    }));

    const context = scoredChunks.map(({ chunk }) => chunk.content).join('\n\n');
    const responseText = await generateAssistantReply({
      systemPrompt: conversation.agent.systemPrompt,
      userMessage: content,
      context,
      citations: citations.map((citation) => ({
        title: citation.documentId,
        excerpt: citation.quote,
        score: citation.relevanceScore,
      })),
    });

    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: responseText,
        citations,
        modelUsed: conversation.agent.model,
        tokensUsed: countTokens(responseText),
        metadata: { sourceCount: citations.length },
      },
    });

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write(`data: ${JSON.stringify({ type: 'message_start', id: assistantMessage.id })}\n\n`);
      for (const chunk of responseText.split(' ')) {
        res.write(`data: ${JSON.stringify({ type: 'delta', text: `${chunk} ` })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ type: 'message_end' })}\n\n`);
      res.end();
      return;
    }

    res.status(201).json({ success: true, data: assistantMessage });
  }),
);

chatRouter.post(
  '/conversations/:conversationId/end',
  asyncHandler(async (req, res) => {
    const { satisfactionScore, feedback } = req.body as {
      satisfactionScore?: number;
      feedback?: string;
    };

    const conversation = await prisma.conversation.update({
      where: { id: req.params.conversationId },
      data: {
        status: ConversationStatus.ENDED,
        satisfactionScore,
        feedback,
        endedAt: new Date(),
      },
    });

    res.json({ success: true, data: conversation });
  }),
);

chatRouter.get(
  '/conversations',
  asyncHandler(async (req, res) => {
    const organizationId = req.params.organizationId as string;
    const conversations = await prisma.conversation.findMany({
      where: { organizationId },
      include: { agent: true, messages: true },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      success: true,
      data: conversations,
    });
  }),
);
