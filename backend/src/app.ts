import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { notFound, errorHandler } from './middleware/error-handler';
import { healthRouter } from './modules/health';
import { authRouter } from './modules/auth';
import { organizationRouter } from './modules/organizations';
import { knowledgeBaseRouter } from './modules/knowledge-base';
import { agentRouter } from './modules/agents';
import { chatRouter } from './modules/chat';
import { ticketRouter } from './modules/tickets';
import { analyticsRouter } from './modules/analytics';
import { auditRouter } from './modules/audit';
import { adminRouter } from './modules/admin';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(pinoHttp());
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      limit: env.RATE_LIMIT_MAX_REQUESTS,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.get('/api', (_req, res) =>
    res.json({
      success: true,
      data: {
        name: 'SupportGPT API',
        version: 'v1',
      },
    }),
  );

  app.use('/api/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/organizations', organizationRouter);
  app.use('/api/v1/organizations/:organizationId/knowledge-bases', knowledgeBaseRouter);
  app.use('/api/v1/organizations/:organizationId/agents', agentRouter);
  app.use('/api/v1/organizations/:organizationId', chatRouter);
  app.use('/api/v1/organizations/:organizationId/tickets', ticketRouter);
  app.use('/api/v1/organizations/:organizationId/analytics', analyticsRouter);
  app.use('/api/v1/organizations/:organizationId/audit-logs', auditRouter);
  app.use('/api/v1/admin', adminRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
