import { User, Vendor, UserRole, UserStatus } from '@prisma/client';
import { AuthRepository } from './auth.repository';
import {
  CustomerRegisterDto,
  ProviderRegisterDto,
  LoginRequestDto,
  AdminLoginRequestDto,
  VerifyEmailRequestDto,
  ResendVerificationDto,
  RefreshTokenRequestDto,
  ForgotPasswordRequestDto,
  ResetPasswordRequestDto,
  ChangePasswordRequestDto,
  GoogleAuthDto,
  AuthResponse,
  AuthTokens,
} from './auth.types';
import { hashPassword } from '../../common/utils/hash-password';
import { comparePassword } from '../../common/utils/compare-password';
import { generateAccessToken } from '../../common/utils/generate-jwt';
import {
  hashToken,
  generateSecureToken,
  encryptSecret,
  decryptSecret,
  generateTotpSecret,
  verifyTotpCode,
} from '../../common/utils/crypto.utils';
import { sendEmail } from '../../common/utils/send-email';
import {
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  NotFoundError,
} from '../../common/utils/app-error';
import logger from '../../config/logger';
import { env } from '../../config/env';

export interface DeviceMetadata {
  deviceId?: string;
  deviceType?: string;
  userAgent?: string;
  ipAddress?: string;
}

export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  // =========================================================================
  // Token & Session Helper
  // =========================================================================

  private async createSessionAndTokens(
    user: User,
    meta?: DeviceMetadata
  ): Promise<AuthTokens> {
    const rawRefreshToken = generateSecureToken(48);
    const refreshTokenHashed = hashToken(rawRefreshToken);

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7); // 7 days

    const session = await this.authRepository.createSession({
      userId: user.id,
      refreshTokenHash: refreshTokenHashed,
      expiresAt: refreshExpiresAt,
      deviceId: meta?.deviceId,
      deviceType: meta?.deviceType,
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
    });

    const accessToken = generateAccessToken({
      sub: user.id,
      userId: user.id,
      role: user.role,
      sessionId: session.id,
    });

    return {
      accessToken,
      refreshToken: `${session.id}.${rawRefreshToken}`,
      expiresIn: env.JWT_EXPIRES_IN,
    };
  }

  private sanitizeUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      avatar: user.avatar,
    };
  }

  private sanitizeVendor(vendor?: Vendor | null) {
    if (!vendor) return null;
    return {
      id: vendor.id,
      businessName: vendor.businessName,
      slug: vendor.slug,
      status: vendor.status,
      isVerified: vendor.isVerified,
      isActive: vendor.isActive,
    };
  }

  // =========================================================================
  // 1. Customer Authentication
  // =========================================================================

  async registerCustomer(dto: CustomerRegisterDto, meta?: DeviceMetadata): Promise<AuthResponse> {
    const { name, email, phone, password } = dto;
    logger.info(`AuthService: Customer registration attempt: ${email}`);

    const existingEmail = await this.authRepository.findByEmail(email);
    if (existingEmail) {
      throw new ConflictError('A user with this email address already exists.');
    }

    const existingPhone = await this.authRepository.findByPhone(phone);
    if (existingPhone) {
      throw new ConflictError('A user with this phone number already exists.');
    }

    const passwordHash = await hashPassword(password);
    const rawVerificationToken = generateSecureToken(32);
    const tokenHash = hashToken(rawVerificationToken);

    const tokenExpiresAt = new Date();
    tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24); // 24-hour verification window

    const user = await this.authRepository.createCustomerUser(
      {
        name,
        email,
        phone,
        passwordHash,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
      },
      tokenHash,
      tokenExpiresAt
    );

    // Send email verification asynchronously
    sendEmail({
      to: user.email,
      subject: 'Verify your email - Shubh Mangalam',
      text: `Welcome to Shubh Mangalam, ${user.name}! Please verify your email using token: ${rawVerificationToken}`,
      html: `<p>Welcome to Shubh Mangalam, <strong>${user.name}</strong>!</p><p>Please verify your email using token: <code>${rawVerificationToken}</code></p>`,
    }).catch((err) => logger.error('Failed to send verification email', err));

    const tokens = await this.createSessionAndTokens(user, meta);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async loginCustomer(dto: LoginRequestDto, meta?: DeviceMetadata): Promise<AuthResponse> {
    const { email, password } = dto;
    logger.info(`AuthService: Customer login attempt: ${email}`);

    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (user.role !== UserRole.CUSTOMER) {
      throw new ForbiddenError('This login portal is only for customers. Please use the appropriate app.');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenError('Your account has been suspended. Please contact customer support.');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const tokens = await this.createSessionAndTokens(user, meta);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  // =========================================================================
  // 2. Provider Authentication
  // =========================================================================

  async registerProvider(dto: ProviderRegisterDto, meta?: DeviceMetadata): Promise<AuthResponse> {
    const { name, email, phone, password, businessName, city } = dto;
    logger.info(`AuthService: Provider registration attempt: ${email} for business: ${businessName}`);

    const existingEmail = await this.authRepository.findByEmail(email);
    if (existingEmail) {
      throw new ConflictError('A user with this email address already exists.');
    }

    const existingPhone = await this.authRepository.findByPhone(phone);
    if (existingPhone) {
      throw new ConflictError('A user with this phone number already exists.');
    }

    const passwordHash = await hashPassword(password);
    const rawVerificationToken = generateSecureToken(32);
    const tokenHash = hashToken(rawVerificationToken);

    const tokenExpiresAt = new Date();
    tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24);

    const baseSlug = businessName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-');
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const userWithVendor = await this.authRepository.createProviderUser(
      {
        name,
        email,
        phone,
        passwordHash,
        role: UserRole.VENDOR,
        status: UserStatus.ACTIVE,
      },
      {
        businessName,
        slug,
        phone,
        email,
        city,
      },
      tokenHash,
      tokenExpiresAt
    );

    sendEmail({
      to: userWithVendor.email,
      subject: 'Verify your partner email - Shubh Mangalam',
      text: `Welcome Partner ${businessName}! Please verify your email using token: ${rawVerificationToken}. Your vendor account status is PENDING review.`,
      html: `<p>Welcome Partner <strong>${businessName}</strong>!</p><p>Please verify your email using token: <code>${rawVerificationToken}</code>.</p><p>Your vendor account status is currently <strong>PENDING</strong> review by our administration team.</p>`,
    }).catch((err) => logger.error('Failed to send verification email', err));

    const tokens = await this.createSessionAndTokens(userWithVendor, meta);

    return {
      user: this.sanitizeUser(userWithVendor),
      vendor: this.sanitizeVendor(userWithVendor.vendorProfile),
      tokens,
    };
  }

  async loginProvider(dto: LoginRequestDto, meta?: DeviceMetadata): Promise<AuthResponse> {
    const { email, password } = dto;
    logger.info(`AuthService: Provider login attempt: ${email}`);

    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (user.role !== UserRole.VENDOR) {
      throw new ForbiddenError('This login portal is only for service providers.');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenError('Your account has been suspended. Please contact platform support.');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const tokens = await this.createSessionAndTokens(user, meta);

    return {
      user: this.sanitizeUser(user),
      vendor: this.sanitizeVendor(user.vendorProfile),
      tokens,
    };
  }

  // =========================================================================
  // 3. Admin Authentication & MFA
  // =========================================================================

  async loginAdmin(dto: AdminLoginRequestDto, meta?: DeviceMetadata): Promise<AuthResponse> {
    const { email, password, mfaCode } = dto;
    logger.info(`AuthService: Admin login attempt: ${email}`);

    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Access denied. Administrator privileges required.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenError('Administrator account is inactive or suspended.');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    // Check MFA requirements
    if (user.adminMfa && user.adminMfa.enabled) {
      if (!mfaCode) {
        // Return MFA challenge requirement with temporary token
        const tempToken = generateAccessToken({
          sub: user.id,
          userId: user.id,
          role: 'ADMIN',
        });
        return {
          user: this.sanitizeUser(user),
          mfaRequired: true,
          tempToken,
        };
      }

      // Verify submitted TOTP code
      const decryptedSecret = decryptSecret(user.adminMfa.secretEncrypted);
      const isOtpValid = verifyTotpCode(decryptedSecret, mfaCode);
      if (!isOtpValid) {
        throw new UnauthorizedError('Invalid 6-digit MFA verification code.');
      }
    }

    const tokens = await this.createSessionAndTokens(user, meta);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  // =========================================================================
  // 4. Token Refresh (Rotation & Revocation)
  // =========================================================================

  async refreshToken(dto: RefreshTokenRequestDto, _meta?: DeviceMetadata): Promise<AuthTokens> {
    const { refreshToken } = dto;
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token is required.');
    }

    // Support format: "sessionId.rawToken" or standard token
    const parts = refreshToken.split('.');
    const rawToken = parts.length > 1 ? parts.slice(1).join('.') : refreshToken;
    const tokenHash = hashToken(rawToken);

    // 1. Look up session in database
    const session = await this.authRepository.findSessionByHash(tokenHash);

    if (!session) {
      logger.warn('AuthService: Refresh attempt with unknown token hash.');
      throw new UnauthorizedError('Invalid or expired refresh token.');
    }

    // 2. Check revocation (Token Reuse Detection)
    if (session.revokedAt) {
      logger.warn(
        `AuthService: Replay attack suspected! Revoked token used for user: ${session.userId}. Revoking all sessions.`
      );
      await this.authRepository.revokeAllUserSessions(session.userId);
      throw new UnauthorizedError('Refresh token has been revoked. All sessions terminated for security.');
    }

    // 3. Check expiration
    if (new Date() > session.expiresAt) {
      await this.authRepository.revokeSession(session.id);
      throw new UnauthorizedError('Refresh token has expired. Please log in again.');
    }

    // 4. Verify user status
    const user = session.user;
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenError('Account is not active.');
    }

    // 5. Rotate token: Issue new raw token, update session hash and expiry
    const newRawRefreshToken = generateSecureToken(48);
    const newRefreshTokenHash = hashToken(newRawRefreshToken);

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    await this.authRepository.rotateSession(session.id, newRefreshTokenHash, newExpiresAt);

    const accessToken = generateAccessToken({
      sub: user.id,
      userId: user.id,
      role: user.role,
      sessionId: session.id,
    });

    const newRotatedToken = `${session.id}.${newRawRefreshToken}`;

    return {
      accessToken,
      refreshToken: newRotatedToken,
      expiresIn: env.JWT_EXPIRES_IN,
    };
  }

  // =========================================================================
  // 5. Logout & Session Revocation
  // =========================================================================

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    const parts = refreshToken.split('.');
    const rawToken = parts.length > 1 ? parts.slice(1).join('.') : refreshToken;
    const tokenHash = hashToken(rawToken);

    const session = await this.authRepository.findSessionByHash(tokenHash);
    if (session) {
      await this.authRepository.revokeSession(session.id);
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.authRepository.revokeAllUserSessions(userId);
  }

  // =========================================================================
  // 6. Current User Profile (/me)
  // =========================================================================

  async getCurrentUser(userId: string): Promise<AuthResponse> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    return {
      user: this.sanitizeUser(user),
      vendor: this.sanitizeVendor(user.vendorProfile),
    };
  }

  // =========================================================================
  // 7. Email Verification
  // =========================================================================

  async verifyEmail(dto: VerifyEmailRequestDto): Promise<{ message: string }> {
    const token = dto.token || dto.otp;
    if (!token) {
      throw new BadRequestError('Verification token is required.');
    }

    const tokenHash = hashToken(token);
    const verificationRecord = await this.authRepository.findEmailVerificationToken(tokenHash);

    if (!verificationRecord) {
      throw new BadRequestError('Invalid or expired email verification token.');
    }

    if (verificationRecord.usedAt) {
      throw new BadRequestError('Email verification token has already been used.');
    }

    if (new Date() > verificationRecord.expiresAt) {
      throw new BadRequestError('Email verification token has expired.');
    }

    await this.authRepository.consumeEmailVerificationToken(
      verificationRecord.id,
      verificationRecord.userId
    );

    return { message: 'Email address verified successfully.' };
  }

  async resendVerificationEmail(dto: ResendVerificationDto): Promise<{ message: string }> {
    const { email } = dto;
    const user = await this.authRepository.findByEmail(email);

    if (user && !user.emailVerified) {
      const rawToken = generateSecureToken(32);
      const tokenHash = hashToken(rawToken);

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await this.authRepository.createEmailVerificationToken(user.id, tokenHash, expiresAt);

      sendEmail({
        to: user.email,
        subject: 'Verify your email - Shubh Mangalam',
        text: `Please verify your email using token: ${rawToken}`,
        html: `<p>Please verify your email using token: <code>${rawToken}</code></p>`,
      }).catch((err) => logger.error('Failed to resend verification email', err));
    }

    // Always return generic response to prevent user enumeration
    return {
      message: 'If an unverified account with that email exists, a new verification link has been sent.',
    };
  }

  // =========================================================================
  // 8. Password Management
  // =========================================================================

  async forgotPassword(dto: ForgotPasswordRequestDto): Promise<{ message: string }> {
    const { email } = dto;
    const user = await this.authRepository.findByEmail(email);

    if (user) {
      const rawToken = generateSecureToken(32);
      const tokenHash = hashToken(rawToken);

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

      await this.authRepository.createPasswordResetToken(user.id, tokenHash, expiresAt);

      sendEmail({
        to: user.email,
        subject: 'Reset your password - Shubh Mangalam',
        text: `You requested a password reset. Use token: ${rawToken} within 1 hour. If you did not request this, please ignore.`,
        html: `<p>You requested a password reset. Use token: <code>${rawToken}</code> within 1 hour.</p><p>If you did not request this, please ignore this email.</p>`,
      }).catch((err) => logger.error('Failed to send password reset email', err));
    }

    return {
      message: 'If your account is registered, a password reset email has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordRequestDto): Promise<{ message: string }> {
    const token = dto.token || dto.otp;
    if (!token) {
      throw new BadRequestError('Password reset token is required.');
    }

    const tokenHash = hashToken(token);
    const resetRecord = await this.authRepository.findPasswordResetToken(tokenHash);

    if (!resetRecord) {
      throw new BadRequestError('Invalid or expired password reset token.');
    }

    if (resetRecord.usedAt) {
      throw new BadRequestError('Password reset token has already been used.');
    }

    if (new Date() > resetRecord.expiresAt) {
      throw new BadRequestError('Password reset token has expired.');
    }

    const newPasswordHash = await hashPassword(dto.newPassword);

    await this.authRepository.consumePasswordResetToken(
      resetRecord.id,
      resetRecord.userId,
      newPasswordHash
    );

    return { message: 'Password has been reset successfully. All existing sessions have been revoked.' };
  }

  async changePassword(userId: string, dto: ChangePasswordRequestDto): Promise<{ message: string }> {
    const { currentPassword, newPassword } = dto;
    const user = await this.authRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found.');
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestError('Current password does not match.');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestError('New password cannot be the same as the current password.');
    }

    const newPasswordHash = await hashPassword(newPassword);
    await this.authRepository.updateUserPassword(userId, newPasswordHash);

    return { message: 'Password updated successfully.' };
  }

  // =========================================================================
  // 9. Google OAuth Foundation
  // =========================================================================

  async googleAuth(dto: GoogleAuthDto, meta?: DeviceMetadata): Promise<AuthResponse> {
    const { idToken, role, businessName, email: clientEmail, name: clientName, avatar: clientAvatar } = dto;

    // Generate consistent Google subject identifier from email or idToken
    const cleanEmail = (clientEmail || '').toLowerCase().trim();
    const tokenSource = cleanEmail || idToken;
    const googleSub = hashToken(tokenSource).slice(0, 24);
    const targetEmail = cleanEmail || `google.${googleSub.slice(0, 8)}@gmail.com`;
    const targetName = clientName?.trim() || 'Google User';

    let oauthAccount = await this.authRepository.findOAuthAccount('GOOGLE', googleSub);

    let user: User & { vendorProfile?: Vendor | null };

    if (oauthAccount) {
      user = oauthAccount.user;
    } else {
      const existingUser = await this.authRepository.findByEmail(targetEmail);

      if (existingUser) {
        try {
          await this.authRepository.linkOAuthAccount(existingUser.id, 'GOOGLE', googleSub);
        } catch {
          // If already linked, proceed
        }
        user = existingUser;
      } else {
        const dummyPasswordHash = await hashPassword(generateSecureToken(16));
        const baseSlug = (businessName || targetName || 'vendor')
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-');

        user = await this.authRepository.createOAuthUser(
          {
            name: targetName,
            email: targetEmail,
            phone: `+9190000${Math.floor(10000 + Math.random() * 90000)}`,
            avatar: clientAvatar || null,
            passwordHash: dummyPasswordHash,
            role: role as UserRole,
            status: UserStatus.ACTIVE,
          },
          'GOOGLE',
          googleSub,
          role === 'VENDOR'
            ? {
                businessName: businessName?.trim() || `${targetName} Events & Celebrations`,
                slug: `${baseSlug}-${Date.now().toString().slice(-4)}`,
                phone: `+9190000${Math.floor(10000 + Math.random() * 90000)}`,
                email: targetEmail,
              }
            : undefined
        );
      }
    }

    // If logging in as VENDOR and vendorProfile does not exist yet, provision it
    if (role === 'VENDOR' && !user.vendorProfile) {
      const baseSlug = (businessName || user.name || 'vendor')
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-');

      const newVendor = await this.authRepository.createVendorProfile(user.id, {
        businessName: businessName?.trim() || `${user.name} Events & Services`,
        slug: `${baseSlug}-${Date.now().toString().slice(-4)}`,
        phone: user.phone || `+9190000${Math.floor(10000 + Math.random() * 90000)}`,
        email: user.email,
      });
      user.vendorProfile = newVendor;
    }

    const tokens = await this.createSessionAndTokens(user, meta);

    return {
      user: this.sanitizeUser(user),
      vendor: this.sanitizeVendor(user.vendorProfile),
      tokens,
    };
  }

  // =========================================================================
  // 10. Admin MFA (Setup, Verify & Disable)
  // =========================================================================

  async setupAdminMfa(userId: string): Promise<{ secret: string; otpauthUrl: string }> {
    const user = await this.authRepository.findById(userId);
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenError('MFA setup is only available for administrators.');
    }

    const rawSecret = generateTotpSecret(32);
    const encryptedSecret = encryptSecret(rawSecret);

    await this.authRepository.upsertAdminMfa(userId, encryptedSecret);

    const otpauthUrl = `otpauth://totp/ShubhMangalamAdmin:${encodeURIComponent(
      user.email
    )}?secret=${rawSecret}&issuer=ShubhMangalam`;

    return {
      secret: rawSecret,
      otpauthUrl,
    };
  }

  async verifyAdminMfa(userId: string, code: string): Promise<{ message: string }> {
    const user = await this.authRepository.findById(userId);
    if (!user || !user.adminMfa) {
      throw new BadRequestError('MFA has not been initialized for this account.');
    }

    const decrypted = decryptSecret(user.adminMfa.secretEncrypted);
    const isValid = verifyTotpCode(decrypted, code);

    if (!isValid) {
      throw new BadRequestError('Invalid 6-digit verification code.');
    }

    await this.authRepository.enableAdminMfa(userId);

    return { message: 'MFA enabled and verified successfully.' };
  }

  async disableAdminMfa(userId: string, code: string, password: string): Promise<{ message: string }> {
    const user = await this.authRepository.findById(userId);
    if (!user || !user.adminMfa || !user.adminMfa.enabled) {
      throw new BadRequestError('MFA is not currently enabled.');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid administrator password.');
    }

    const decrypted = decryptSecret(user.adminMfa.secretEncrypted);
    const isValid = verifyTotpCode(decrypted, code);

    if (!isValid) {
      throw new BadRequestError('Invalid 6-digit verification code.');
    }

    await this.authRepository.disableAdminMfa(userId);

    return { message: 'MFA has been successfully disabled.' };
  }
}

export default AuthService;
