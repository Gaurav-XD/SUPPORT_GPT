import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().optional().default('redis://localhost:6379/0'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRY: z.coerce.number().default(900),
  REFRESH_TOKEN_SECRET: z.string().min(16),
  REFRESH_TOKEN_EXPIRY: z.coerce.number().default(604800),
  OPENAI_API_KEY: z.string().optional().default(''),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_CALLBACK_URL: z.string().optional().default('http://localhost:3001/api/v1/auth/google/callback'),
  BCRYPT_ROUNDS: z.coerce.number().default(10),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  MAX_FILE_SIZE: z.coerce.number().default(50 * 1024 * 1024),
  CHUNK_SIZE: z.coerce.number().default(300),
  CHUNK_OVERLAP: z.coerce.number().default(50),
  ENABLE_AI_FEATURES: z.coerce.boolean().default(true),
  ENABLE_VECTOR_SEARCH: z.coerce.boolean().default(true),
});

const parsed = schema.parse(process.env);

export const env = {
  ...parsed,
  JWT_EXPIRY_SECONDS: parsed.JWT_EXPIRY,
  REFRESH_TOKEN_EXPIRY_SECONDS: parsed.REFRESH_TOKEN_EXPIRY,
};
