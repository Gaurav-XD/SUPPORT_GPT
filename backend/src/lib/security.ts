import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/env';

export async function hashPassword(password: string) {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(payload: { userId: string; email: string }) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRY_SECONDS });
}

export function signRefreshToken(payload: { userId: string; email: string }) {
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRY_SECONDS,
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as { userId: string; email: string; iat: number; exp: number };
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as { userId: string; email: string; iat: number; exp: number };
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateInviteToken() {
  return crypto.randomBytes(24).toString('hex');
}

export function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}
