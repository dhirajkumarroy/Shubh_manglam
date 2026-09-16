import path from 'path';
import { User } from '@prisma/client';
import { UserRepository } from './user.repository';
import { NotFoundError, ConflictError, BadRequestError } from '../../common/utils/app-error';
import { UpdateProfileRequestDto, ChangePasswordRequestDto } from './user.types';
import { comparePassword } from '../../common/utils/compare-password';
import { hashPassword } from '../../common/utils/hash-password';
import { storageService } from '../uploads/storage.service';
import logger from '../../config/logger';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Retrieves profile details of the user by ID and omits the password field.
   * @param userId User database ID.
   */
  async getProfile(userId: string): Promise<Omit<User, 'passwordHash'>> {
    logger.info(`UserService: Fetching user profile for ID ${userId}`);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      logger.warn(`UserService: Profile fetch failed. User not found for ID ${userId}`);
      throw new NotFoundError('User profile not found.');
    }

    // Exclude password hash from profile data return
    const { passwordHash, ...profile } = user;
    logger.info(`UserService: Successfully retrieved profile for email: ${profile.email}`);

    return profile;
  }

  /**
   * Updates name and phone of the user profile after confirming validity and uniqueness constraints.
   * @param userId User database ID.
   * @param dto Request data containing optional name and phone.
   */
  async updateProfile(userId: string, dto: UpdateProfileRequestDto): Promise<Omit<User, 'passwordHash'>> {
    const { name, phone } = dto;
    logger.info(`UserService: Updating user profile for ID ${userId}`);

    // 1. Confirm user profile exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      logger.warn(`UserService: Profile update failed. User not found for ID ${userId}`);
      throw new NotFoundError('User profile not found.');
    }

    // 2. Validate phone number uniqueness if it is being modified
    if (phone && phone !== user.phone) {
      const existingUserWithPhone = await this.userRepository.findByPhone(phone);
      if (existingUserWithPhone) {
        logger.warn(`UserService: Profile update failed. Phone already registered by another user: ${phone}`);
        throw new ConflictError('A user with this phone number already exists.');
      }
    }

    // 3. Perform the update
    const updatedUser = await this.userRepository.update(userId, {
      name: name ?? undefined,
      phone: phone ?? undefined,
    });

    logger.info(`UserService: Profile successfully updated for user email ${updatedUser.email}`);

    // Exclude password hash from profile data return
    const { passwordHash, ...profile } = updatedUser;
    return profile;
  }

  /**
   * Modifies the user password after verifying validity of current password credentials.
   * @param userId User database ID.
   * @param dto Request payload details.
   */
  async changePassword(userId: string, dto: ChangePasswordRequestDto): Promise<void> {
    const { oldPassword, newPassword } = dto;
    logger.info(`UserService: Password change requested for user ID ${userId}`);

    // 1. Check user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      logger.warn(`UserService: Password change failed. User not found for ID ${userId}`);
      throw new NotFoundError('User profile not found.');
    }

    // 2. Validate current password matches
    const isPasswordMatch = await comparePassword(oldPassword, user.passwordHash);
    if (!isPasswordMatch) {
      logger.warn(`UserService: Password change failed. Current password mismatch for user ID ${userId}`);
      throw new BadRequestError('Invalid current password.');
    }

    // 3. Prevent using the same password
    const isSamePassword = await comparePassword(newPassword, user.passwordHash);
    if (isSamePassword) {
      logger.warn(`UserService: Password change failed. New password matches current password for user ID ${userId}`);
      throw new BadRequestError('New password cannot be the same as the old password.');
    }

    // 4. Hash new password and update user record
    const hashedPassword = await hashPassword(newPassword);
    await this.userRepository.update(userId, {
      passwordHash: hashedPassword,
    });

    logger.info(`UserService: Password successfully updated for user email ${user.email}`);
  }

  /**
   * Uploads a new avatar image, removes the old one from storage, and updates the path in user profile.
   * @param userId User database ID.
   * @param file Express.Multer.File object containing buffer data.
   */
  async updateAvatar(userId: string, file: Express.Multer.File): Promise<Omit<User, 'passwordHash'>> {
    logger.info(`UserService: Uploading avatar image for user ID ${userId}`);

    // 1. Check user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      logger.warn(`UserService: Avatar upload failed. User not found for ID ${userId}`);
      throw new NotFoundError('User profile not found.');
    }

    // 2. Safely delete the old avatar file from storage if one exists
    if (user.avatar) {
      try {
        logger.info(`UserService: Deleting previous avatar: ${user.avatar}`);
        await storageService.deleteFile(user.avatar);
      } catch (err) {
        logger.warn(`UserService: Failed to delete previous avatar ${user.avatar}. Proceeding anyway. Error: ${err}`);
      }
    }

    // 3. Generate a unique name for the uploaded file
    const fileExtension = path.extname(file.originalname) || '.jpg';
    const fileName = `avatar-${userId}-${Date.now()}${fileExtension}`;

    // 4. Upload raw buffer to storage service (local or Cloudinary)
    const fileUrlOrPath = await storageService.uploadFile(
      file.buffer,
      fileName,
      'profiles',
      file.mimetype
    );

    // 5. Update user database record with the new path/url
    const updatedUser = await this.userRepository.update(userId, {
      avatar: fileUrlOrPath,
    });

    logger.info(`UserService: Avatar successfully updated for user email ${updatedUser.email}`);

    // Exclude password hash from profile data return
    const { passwordHash, ...profile } = updatedUser;
    return profile;
  }
}

export default UserService;

