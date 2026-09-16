import { User } from '@prisma/client';
import { AuthRepository } from './auth.repository';
import {
  RegisterRequestDto,
  LoginRequestDto,
  VerifyEmailRequestDto,
  RefreshTokenRequestDto,
  ForgotPasswordRequestDto,
  ResetPasswordRequestDto,
  LogoutRequestDto,
} from './auth.types';
import { sendEmail } from '../../common/utils/send-email';
import { hashPassword } from '../../common/utils/hash-password';
import { comparePassword } from '../../common/utils/compare-password';
import { generateOtp } from '../../common/utils/generate-otp';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../common/utils/generate-jwt';
import {
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  NotFoundError,
} from '../../common/utils/app-error';
import logger from '../../config/logger';

export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  /**
   * Registers a new user, hashes password, and saves transactionally with a verification OTP.
   */
  async register(dto: RegisterRequestDto): Promise<User> {
    const { name, email, phone, password } = dto;

    logger.info(`Attempting to register new user with email: ${email}`);

    const existingEmail = await this.authRepository.findByEmail(email);
    if (existingEmail) {
      logger.warn(`Registration failed. Email already registered: ${email}`);
      throw new ConflictError('A user with this email address already exists.');
    }

    const existingPhone = await this.authRepository.findByPhone(phone);
    if (existingPhone) {
      logger.warn(`Registration failed. Phone already registered: ${phone}`);
      throw new ConflictError('A user with this phone number already exists.');
    }

    const hashedPassword = await hashPassword(password);
    const otpCode = generateOtp();
    const otpExpiresAt = new Date();
    otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 10); // OTP valid for 10 minutes

    const user = await this.authRepository.createUserWithOtp(
      {
        name,
        email,
        phone,
        passwordHash: hashedPassword,
        role: 'CUSTOMER',
      },
      otpCode,
      otpExpiresAt
    );

    logger.info(`User registered successfully: ${email}. Verification OTP: ${otpCode}`);

    return user;
  }

  /**
   * Logs a user in, verifies credentials, and issues authorization tokens.
   */
  async login(dto: LoginRequestDto): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const { email, password } = dto;

    logger.info(`User login attempt with email: ${email}`);

    // 1. Authenticate user exists
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      logger.warn(`Login failed. Invalid email: ${email}`);
      throw new UnauthorizedError('Invalid email address or password.');
    }

    // 2. Authenticate password matches
    const isPasswordMatch = await comparePassword(password, user.passwordHash);
    if (!isPasswordMatch) {
      logger.warn(`Login failed. Password mismatch for email: ${email}`);
      throw new UnauthorizedError('Invalid email address or password.');
    }

    // 3. Confirm email verification status
    if (!user.isEmailVerified) {
      logger.warn(`Login blocked. Unverified email: ${email}`);
      throw new ForbiddenError('Your email address is not verified. Please verify your email first.');
    }

    // 3.5. Confirm user is not blocked
    if (user.isBlocked) {
      logger.warn(`Login blocked. Blocked user attempt: ${email}`);
      throw new ForbiddenError('Your account has been blocked by an administrator.');
    }

    // 4. Sign JWT Tokens
    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    logger.info(`User logged in successfully: ${email}`);

    return { user, accessToken, refreshToken };
  }

  /**
   * Verifies the user's email address using the registration OTP code.
   */
  async verifyEmail(dto: VerifyEmailRequestDto): Promise<void> {
    const { email, otp } = dto;

    logger.info(`Attempting to verify email: ${email} with OTP: ${otp}`);

    // 1. Retrieve user to check if they exist or are already verified
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      logger.warn(`Email verification failed. User not found: ${email}`);
      throw new NotFoundError('User not found.');
    }

    if (user.isEmailVerified) {
      logger.warn(`Email verification skipped. Email already verified: ${email}`);
      throw new BadRequestError('Email address is already verified.');
    }

    // 2. Look up the OTP record
    const otpRecord = await this.authRepository.findOtp(email, otp, 'EMAIL_VERIFICATION');
    if (!otpRecord) {
      logger.warn(`Email verification failed. Invalid OTP code: ${otp} for email: ${email}`);
      throw new BadRequestError('Invalid OTP code or email address.');
    }

    // 3. Check for OTP expiration
    const now = new Date();
    if (otpRecord.expiresAt < now) {
      logger.warn(`Email verification failed. OTP code expired for email: ${email}`);
      throw new BadRequestError('OTP has expired. Please request a new one.');
    }

    // 4. Confirm verification and delete the OTP atomically in a transaction
    await this.authRepository.verifyUserEmailAndDeleteOtp(email, otpRecord.id);

    logger.info(`Email verification successful for user: ${email}`);
  }

  /**
   * Validates refresh token, confirms user identity, and issues new tokens (rotation enabled).
   */
  async refreshToken(dto: RefreshTokenRequestDto): Promise<{ accessToken: string; refreshToken: string }> {
    const { refreshToken } = dto;

    logger.info('Attempting to refresh access token using refresh token.');

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      logger.warn(`Token refresh failed: Invalid or expired refresh token. Error: ${error instanceof Error ? error.message : error}`);
      throw new UnauthorizedError('Invalid or expired refresh token.');
    }

    const user = await this.authRepository.findById(payload.userId);
    if (!user) {
      logger.warn(`Token refresh failed. User not found for ID: ${payload.userId}`);
      throw new UnauthorizedError('User not found.');
    }

    if (!user.isEmailVerified) {
      logger.warn(`Token refresh failed. User email is unverified: ${user.email}`);
      throw new ForbiddenError('Your email address is not verified. Please verify your email first.');
    }

    if (user.isBlocked) {
      logger.warn(`Token refresh failed. User is blocked: ${user.email}`);
      throw new ForbiddenError('Your account has been blocked by an administrator.');
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    logger.info(`Tokens refreshed successfully for user: ${user.email}`);

    return { accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Generates a password reset OTP and sends it via email.
   */
  async forgotPassword(dto: ForgotPasswordRequestDto): Promise<void> {
    const { email } = dto;

    logger.info(`Forgot password request initiated for email: ${email}`);

    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      logger.warn(`Forgot password request failed. Email address not found: ${email}`);
      throw new NotFoundError('A user with this email address does not exist.');
    }

    // Invalidate any existing password reset OTPs to ensure security
    await this.authRepository.deleteOtps(email, 'PASSWORD_RESET');

    const otpCode = generateOtp();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Code valid for 10 minutes

    await this.authRepository.createOtp(email, otpCode, 'PASSWORD_RESET', expiresAt);

    logger.info(`Password reset OTP created successfully: ${email}. Code: ${otpCode}`);

    // Send reset instructions to user email
    await sendEmail({
      to: email,
      subject: 'Password Reset OTP - Shubh Mangalam',
      text: `Hello ${user.name},\n\nYou requested a password reset. Your 6-digit password reset OTP is:\n\n${otpCode}\n\nThis OTP is valid for 10 minutes. If you did not make this request, please ignore this email.`,
      html: `<p>Hello <strong>${user.name}</strong>,</p><p>You requested a password reset. Your 6-digit password reset OTP is:</p><h3>${otpCode}</h3><p>This OTP is valid for 10 minutes. If you did not make this request, please ignore this email.</p>`,
    });
  }

  /**
   * Resets the user's password using the verification OTP.
   */
  async resetPassword(dto: ResetPasswordRequestDto): Promise<void> {
    const { email, otp, newPassword } = dto;

    logger.info(`Reset password request submitted for email: ${email}`);

    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      logger.warn(`Reset password failed. User not found: ${email}`);
      throw new NotFoundError('User not found.');
    }

    const otpRecord = await this.authRepository.findOtp(email, otp, 'PASSWORD_RESET');
    if (!otpRecord) {
      logger.warn(`Reset password failed. Invalid OTP code: ${otp} for email: ${email}`);
      throw new BadRequestError('Invalid OTP code or email address.');
    }

    const now = new Date();
    if (otpRecord.expiresAt < now) {
      logger.warn(`Reset password failed. OTP code expired for email: ${email}`);
      throw new BadRequestError('OTP has expired. Please request a new one.');
    }

    const hashedPassword = await hashPassword(newPassword);

    await this.authRepository.resetUserPasswordAndDeleteOtps(email, hashedPassword, otpRecord.id);

    logger.info(`Password reset successfully for user: ${email}`);
  }

  /**
   * Logout user.
   */
  async logout(_dto: LogoutRequestDto): Promise<void> {
    logger.info('User logged out successfully.');
  }
}

export default AuthService;

