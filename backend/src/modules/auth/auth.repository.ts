import { Prisma, User, Otp } from '@prisma/client';
import prisma from '../../config/database';

export class AuthRepository {
  /**
   * Find a user by their unique email address.
   * @param email Email address of the user.
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find a user by their unique phone number.
   * @param phone Phone number of the user.
   */
  async findByPhone(phone: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { phone },
    });
  }

  /**
   * Creates a User and an associated OTP code atomically inside a database transaction.
   * @param userData Input data for the user profile creation.
   * @param otpCode The random OTP code generated.
   * @param otpExpiresAt Expiration date for the OTP.
   */
  async createUserWithOtp(
    userData: Prisma.UserCreateInput,
    otpCode: string,
    otpExpiresAt: Date
  ): Promise<User> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: userData,
      });

      await tx.otp.create({
        data: {
          email: user.email,
          code: otpCode,
          type: 'EMAIL_VERIFICATION',
          expiresAt: otpExpiresAt,
        },
      });

      return user;
    });
  }

  /**
   * Find an OTP record by email, code, and type.
   */
  async findOtp(email: string, code: string, type: string): Promise<Otp | null> {
    return prisma.otp.findFirst({
      where: {
        email,
        code,
        type,
      },
    });
  }

  /**
   * Updates user email verification status and deletes the verified OTP record atomically in a transaction.
   */
  async verifyUserEmailAndDeleteOtp(email: string, otpId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { email },
        data: { isEmailVerified: true },
      });

      await tx.otp.delete({
        where: { id: otpId },
      });
    });
  }

  /**
   * Find a user by their unique database ID.
   * @param id Database ID of the user.
   */
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Creates a new OTP record.
   */
  async createOtp(email: string, code: string, type: string, expiresAt: Date): Promise<Otp> {
    return prisma.otp.create({
      data: {
        email,
        code,
        type,
        expiresAt,
      },
    });
  }

  /**
   * Deletes all OTP records of a certain type for an email.
   */
  async deleteOtps(email: string, type: string): Promise<void> {
    await prisma.otp.deleteMany({
      where: { email, type },
    });
  }

  /**
   * Updates user password and deletes the verified OTP record atomically in a transaction.
   */
  async resetUserPasswordAndDeleteOtps(email: string, passwordHash: string, otpId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { email },
        data: { passwordHash },
      });

      await tx.otp.delete({
        where: { id: otpId },
      });
    });
  }
}

export default AuthRepository;



