import { Router } from 'express';
import { Role, UserStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../lib/async-handler';
import {
  AuthError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../lib/errors';
import {
  comparePassword,
  generateResetToken,
  hashPassword,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../lib/security';
import { validate } from '../middleware/validate';
import { publicUser } from './shared';
import axios from 'axios';
import { env } from '../config/env';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const resetRequestSchema = z.object({
  email: z.string().email(),
});

const resetConfirmSchema = z.object({
  token: z.string().min(16),
  newPassword: z.string().min(8),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(16),
});

authRouter.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName } = req.body as z.infer<typeof registerSchema>;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        status: UserStatus.ACTIVE,
      },
    });

    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_EXPIRY_SECONDS * 1000),
      },
    });

    res.status(201).json({
      success: true,
      data: {
        user: publicUser(user),
        accessToken,
        refreshToken,
      },
    });
  }),
);

authRouter.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      throw new AuthError('Invalid credentials');
    }

    const matches = await comparePassword(password, user.passwordHash);
    if (!matches) {
      throw new AuthError('Invalid credentials');
    }

    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_EXPIRY_SECONDS * 1000),
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    res.json({
      success: true,
      data: {
        user: publicUser(user),
        accessToken,
        refreshToken,
        expiresIn: env.JWT_EXPIRY_SECONDS,
      },
    });
  }),
);

authRouter.post(
  '/refresh',
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body as z.infer<typeof refreshSchema>;
    const payload = verifyRefreshToken(refreshToken);
    const hashed = hashToken(refreshToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashed } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new AuthError('Refresh token is no longer valid');
    }

    const accessToken = signAccessToken({ userId: payload.userId, email: payload.email });
    res.json({
      success: true,
      data: { accessToken, expiresIn: env.JWT_EXPIRY_SECONDS },
    });
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const refreshToken = req.body?.refreshToken as string | undefined;
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(refreshToken) },
        data: { revokedAt: new Date() },
      });
    }

    res.status(204).send();
  }),
);

authRouter.post(
  '/password-reset',
  validate(resetRequestSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body as z.infer<typeof resetRequestSchema>;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.json({ success: true, message: 'If the email exists, a reset link has been issued.' });
      return;
    }

    const token = generateResetToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      message: 'If the email exists, a reset link has been issued.',
      devToken: process.env.NODE_ENV === 'development' ? token : undefined,
    });
  }),
);

authRouter.post(
  '/password-reset/confirm',
  validate(resetConfirmSchema),
  asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body as z.infer<typeof resetConfirmSchema>;
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });

    if (!resetToken || resetToken.expiresAt < new Date() || resetToken.consumedAt) {
      throw new AuthError('Reset token is invalid or expired');
    }

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: await hashPassword(newPassword) },
    });

    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { consumedAt: new Date() },
    });

    res.json({ success: true, message: 'Password updated successfully' });
  }),
);

authRouter.get(
  '/google/url',
  asyncHandler(async (_req, res) => {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new ValidationError('Google OAuth is not configured');
    }

    const redirectUri = env.GOOGLE_CALLBACK_URL;
    const url =
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(env.GOOGLE_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      '&response_type=code&scope=email%20profile&access_type=offline&prompt=consent';

    res.json({ success: true, data: { url } });
  }),
);

authRouter.post(
  '/google/callback',
  asyncHandler(async (req, res) => {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      throw new ValidationError('Google OAuth is not configured');
    }

    const code = req.body?.code as string | undefined;
    if (!code) {
      throw new ValidationError('OAuth code is required');
    }

    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code',
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );

    const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenResponse.data.access_token}`,
      },
    });

    const profile = profileResponse.data as { email: string; given_name?: string; family_name?: string; picture?: string; id?: string };
    const user = await prisma.user.upsert({
      where: { email: profile.email },
      update: {
        googleId: profile.id,
        avatarUrl: profile.picture,
        emailVerifiedAt: new Date(),
      },
      create: {
        email: profile.email,
        googleId: profile.id,
        avatarUrl: profile.picture,
        firstName: profile.given_name,
        lastName: profile.family_name,
        emailVerifiedAt: new Date(),
        status: UserStatus.ACTIVE,
      },
    });

    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_EXPIRY_SECONDS * 1000),
      },
    });

    res.json({
      success: true,
      data: {
        user: publicUser(user),
        accessToken,
        refreshToken,
      },
    });
  }),
);

authRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthError();
    }
    const { verifyAccessToken } = await import('../lib/security');
    const payload = verifyAccessToken(authHeader.slice(7));
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const memberships = await prisma.organizationMember.findMany({
      where: { userId: user.id },
      include: { organization: true },
    });

    res.json({
      success: true,
      data: {
        user: publicUser(user),
        memberships: memberships.map((membership) => ({
          organization: {
            id: membership.organization.id,
            name: membership.organization.name,
            slug: membership.organization.slug,
          },
          role: membership.role,
        })),
      },
    });
  }),
);
