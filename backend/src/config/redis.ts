import IORedis from 'ioredis';
import { env } from './env';

export const redis =
  env.NODE_ENV === 'test' || !env.REDIS_URL || env.REDIS_URL.length === 0
    ? null
    : new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
