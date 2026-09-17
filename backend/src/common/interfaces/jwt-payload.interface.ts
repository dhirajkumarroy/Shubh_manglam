import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  userId?: string;
  role: UserRole | 'CUSTOMER' | 'VENDOR' | 'OWNER' | 'ADMIN';
  sessionId?: string;
}
