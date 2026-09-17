import { Prisma, User, Vendor, UserSession, AdminMfa } from '@prisma/client';
import prisma from '../../config/database';

export class AuthRepository {
  /**
   * Find a user by their unique email address.
   */
  async findByEmail(email: string): Promise<(User & { vendorProfile?: Vendor | null; adminMfa?: AdminMfa | null }) | null> {
    return prisma.user.findUnique({
      where: { email },
      include: {
        vendorProfile: true,
        adminMfa: true,
      },
    });
  }

  /**
   * Find a user by their unique phone number.
   */
  async findByPhone(phone: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { phone },
    });
  }

  /**
   * Find a user by their database ID.
   */
  async findById(id: string): Promise<(User & { vendorProfile?: Vendor | null; adminMfa?: AdminMfa | null }) | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        vendorProfile: true,
        adminMfa: true,
      },
    });
  }

  /**
   * Creates a customer user atomically along with an email verification token.
   */
  async createCustomerUser(
    userData: Prisma.UserCreateInput,
    tokenHash: string,
    expiresAt: Date
  ): Promise<User> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: userData,
      });

      await tx.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      return user;
    });
  }

  /**
   * Creates a provider user (role: VENDOR) and vendor profile (status: PENDING) atomically.
   */
  async createProviderUser(
    userData: Prisma.UserCreateInput,
    vendorData: {
      businessName: string;
      slug: string;
      phone: string;
      email: string;
      city?: string;
    },
    tokenHash: string,
    expiresAt: Date
  ): Promise<User & { vendorProfile: Vendor | null }> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: userData,
      });

      const vendor = await tx.vendor.create({
        data: {
          userId: user.id,
          businessName: vendorData.businessName,
          slug: vendorData.slug,
          phone: vendorData.phone,
          email: vendorData.email,
          addressLine1: 'Main Market',
          city: vendorData.city || 'Panipat',
          state: 'Haryana',
          pincode: '132103',
          latitude: 29.3909,
          longitude: 76.9635,
          status: 'PENDING',
          isActive: false,
          isVerified: false,
        },
      });

      await tx.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      return { ...user, vendorProfile: vendor };
    });
  }

  // =========================================================================
  // Session Management (Refresh Token Rotation & Revocation)
  // =========================================================================

  async createSession(data: {
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    deviceId?: string;
    deviceType?: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<UserSession> {
    return prisma.userSession.create({
      data,
    });
  }

  async findSessionByHash(refreshTokenHash: string): Promise<(UserSession & { user: User & { vendorProfile?: Vendor | null } }) | null> {
    return prisma.userSession.findFirst({
      where: { refreshTokenHash },
      include: {
        user: {
          include: {
            vendorProfile: true,
          },
        },
      },
    });
  }

  async rotateSession(
    sessionId: string,
    newRefreshTokenHash: string,
    newExpiresAt: Date
  ): Promise<UserSession> {
    return prisma.userSession.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: newRefreshTokenHash,
        expiresAt: newExpiresAt,
        lastUsedAt: new Date(),
      },
    });
  }

  async revokeSession(sessionId: string): Promise<void> {
    await prisma.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // =========================================================================
  // Email Verification Tokens
  // =========================================================================

  async createEmailVerificationToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  async findEmailVerificationToken(tokenHash: string) {
    return prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  async consumeEmailVerificationToken(tokenId: string, userId: string): Promise<void> {
    await prisma.$transaction([
      prisma.emailVerificationToken.update({
        where: { id: tokenId },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true },
      }),
    ]);
  }

  // =========================================================================
  // Password Reset Tokens
  // =========================================================================

  async createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  async findPasswordResetToken(tokenHash: string) {
    return prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  async consumePasswordResetToken(
    tokenId: string,
    userId: string,
    newPasswordHash: string
  ): Promise<void> {
    await prisma.$transaction([
      prisma.passwordResetToken.update({
        where: { id: tokenId },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      }),
      // Revoke all active sessions on password reset for security
      prisma.userSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  async updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  }

  // =========================================================================
  // Admin MFA Management
  // =========================================================================

  async upsertAdminMfa(userId: string, secretEncrypted: string) {
    return prisma.adminMfa.upsert({
      where: { userId },
      update: {
        secretEncrypted,
        enabled: false,
        verifiedAt: null,
      },
      create: {
        userId,
        secretEncrypted,
        enabled: false,
      },
    });
  }

  async enableAdminMfa(userId: string) {
    return prisma.adminMfa.update({
      where: { userId },
      data: {
        enabled: true,
        verifiedAt: new Date(),
      },
    });
  }

  async disableAdminMfa(userId: string) {
    return prisma.adminMfa.update({
      where: { userId },
      data: {
        enabled: false,
        verifiedAt: null,
      },
    });
  }

  // =========================================================================
  // OAuth Account Linking
  // =========================================================================

  async findOAuthAccount(provider: string, providerAccountId: string) {
    return prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
      include: {
        user: {
          include: {
            vendorProfile: true,
          },
        },
      },
    });
  }

  async createOAuthUser(
    userData: Prisma.UserCreateInput,
    provider: string,
    providerAccountId: string,
    vendorData?: { businessName: string; slug: string; phone: string; email: string }
  ) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          ...userData,
          emailVerified: true,
        },
      });

      await tx.oAuthAccount.create({
        data: {
          userId: user.id,
          provider,
          providerAccountId,
        },
      });

      let vendorProfile = null;
      if (vendorData && user.role === 'VENDOR') {
        vendorProfile = await tx.vendor.create({
          data: {
            userId: user.id,
            businessName: vendorData.businessName,
            slug: vendorData.slug,
            phone: vendorData.phone,
            email: vendorData.email,
            addressLine1: 'Main Market',
            city: 'Panipat',
            state: 'Haryana',
            pincode: '132103',
            latitude: 29.3909,
            longitude: 76.9635,
            status: 'PENDING',
            isActive: false,
            isVerified: false,
          },
        });
      }

      return { ...user, vendorProfile };
    });
  }

  async linkOAuthAccount(userId: string, provider: string, providerAccountId: string) {
    return prisma.oAuthAccount.create({
      data: {
        userId,
        provider,
        providerAccountId,
      },
    });
  }
}

export default AuthRepository;
