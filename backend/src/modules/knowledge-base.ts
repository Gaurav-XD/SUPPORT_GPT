import { Router } from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../lib/async-handler';
import { NotFoundError, ValidationError } from '../lib/errors';
import { authenticate, loadOrganizationMembership } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { chunkText, countTokens } from './shared';
import { generateEmbedding } from '../services/ai';
import { env } from '../config/env';
import { Role, DocumentStatus } from '@prisma/client';

export const knowledgeBaseRouter = Router({ mergeParams: true });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: env.MAX_FILE_SIZE } });

const knowledgeBaseSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

knowledgeBaseRouter.use(authenticate, loadOrganizationMembership);

knowledgeBaseRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const organizationId = req.params.organizationId;
    const knowledgeBases = await prisma.knowledgeBase.findMany({
      where: { organizationId },
      include: { documents: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: knowledgeBases.map((knowledgeBase) => ({
        ...knowledgeBase,
        documentCount: knowledgeBase.documents.length,
      })),
    });
  }),
);

knowledgeBaseRouter.post(
  '/',
  requireRole(Role.ADMIN, Role.MANAGER),
  validate(knowledgeBaseSchema),
  asyncHandler(async (req, res) => {
    const knowledgeBase = await prisma.knowledgeBase.create({
      data: {
        organizationId: req.params.organizationId,
        ...req.body,
      },
    });
    res.status(201).json({ success: true, data: knowledgeBase });
  }),
);

knowledgeBaseRouter.post(
  '/:knowledgeBaseId/documents',
  requireRole(Role.ADMIN, Role.MANAGER),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('A file upload is required');
    }

    const organizationId = req.params.organizationId as string;
    const knowledgeBase = await prisma.knowledgeBase.findFirst({
      where: {
        id: req.params.knowledgeBaseId,
        organizationId,
      },
    });

    if (!knowledgeBase) {
      throw new NotFoundError('Knowledge base not found');
    }

    const fileName = req.body.name || req.file.originalname;
    const mimeType = req.file.mimetype;
    let content = '';
    if (mimeType === 'application/pdf') {
      const parsed = await pdfParse(req.file.buffer);
      content = parsed.text;
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const parsed = await mammoth.extractRawText({ buffer: req.file.buffer });
      content = parsed.value;
    } else {
      content = req.file.buffer.toString('utf8');
    }

    const document = await prisma.document.create({
      data: {
        organizationId,
        knowledgeBaseId: knowledgeBase.id,
        uploadedById: req.user?.id,
        name: fileName,
        filePath: `uploads://${Date.now()}-${fileName}`,
        fileType: mimeType,
        fileSize: req.file.size,
        status: DocumentStatus.PROCESSING,
        metadata: {
          source: 'multipart',
          originalName: req.file.originalname,
        },
      },
    });

    const chunks = chunkText(content, env.CHUNK_SIZE, env.CHUNK_OVERLAP);
    const embeddings = await Promise.all(chunks.map((chunk) => generateEmbedding(chunk)));

    await prisma.documentChunk.createMany({
      data: chunks.map((chunk, index) => ({
        documentId: document.id,
        chunkIndex: index,
        content: chunk,
        tokens: countTokens(chunk),
        embedding: embeddings[index] as never,
        metadata: {
          source: fileName,
          organizationId,
        },
      })),
    });

    const completed = await prisma.document.update({
      where: { id: document.id },
      data: {
        totalChunks: chunks.length,
        parsedAt: new Date(),
        status: DocumentStatus.READY,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...completed,
        chunkCount: chunks.length,
      },
    });
  }),
);

knowledgeBaseRouter.get(
  '/:knowledgeBaseId/documents',
  asyncHandler(async (req, res) => {
    const documents = await prisma.document.findMany({
      where: {
        organizationId: req.params.organizationId,
        knowledgeBaseId: req.params.knowledgeBaseId,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: documents });
  }),
);

knowledgeBaseRouter.get(
  '/:knowledgeBaseId/documents/:documentId',
  asyncHandler(async (req, res) => {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.documentId,
        organizationId: req.params.organizationId,
        knowledgeBaseId: req.params.knowledgeBaseId,
      },
      include: { chunks: true },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    res.json({ success: true, data: document });
  }),
);
