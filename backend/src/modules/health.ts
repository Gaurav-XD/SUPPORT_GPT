import { Router } from 'express';
import { prisma } from '../config/prisma';
import { redis } from '../config/redis';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  const dbOk = await prisma.$queryRaw`SELECT 1`;
  const cacheOk = redis ? redis.status : 'unavailable';
  res.json({
    success: true,
    data: {
      status: 'ok',
      database: Array.isArray(dbOk) ? 'connected' : 'connected',
      cache: cacheOk,
      timestamp: new Date().toISOString(),
    },
  });
});
