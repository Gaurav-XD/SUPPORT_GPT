import type { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: {
        id: string;
        email: string;
      };
      membership?: {
        organizationId: string;
        role: Role;
      };
    }
  }
}

export {};
