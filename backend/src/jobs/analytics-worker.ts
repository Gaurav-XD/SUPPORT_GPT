import { Worker } from 'bullmq';
import { redis } from '../config/redis';

export function startAnalyticsWorker() {
  if (!redis) {
    return null;
  }

  return new Worker(
    'supportgpt-analytics',
      async (job) => {
        console.log('Analytics job received', job.name, job.data);
      },
      {
      connection: redis as any,
      concurrency: 1,
    },
  );
}
