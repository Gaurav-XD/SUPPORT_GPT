import { Worker } from 'bullmq';
import { env } from '../config/env';
import { redis } from '../config/redis';

export function startDocumentWorker() {
  if (!redis) {
    return null;
  }

  return new Worker(
    'supportgpt-documents',
      async (job) => {
        console.log('Document job received', job.name, job.data);
      },
      {
      connection: redis as any,
      concurrency: 2,
    },
  );
}
