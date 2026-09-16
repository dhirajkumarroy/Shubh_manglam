import { Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { updateProfileSchema, changePasswordSchema } from './user.validation';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { ResponseDto } from '../../common/dto/api-response.dto';
import { UnauthorizedError, BadRequestError } from '../../common/utils/app-error';
import logger from '../../config/logger';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * HTTP handler to get the authenticated user's profile.
   * GET /api/v1/users/profile
   */
  getProfile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        logger.warn('UserController: Profile fetch failed due to missing req.user.userId');
        throw new UnauthorizedError('Unauthorized access.');
      }

      const profile = await this.userService.getProfile(userId);

      res.status(200).json(
        ResponseDto.success('User profile retrieved successfully.', profile)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * HTTP handler to update user profile parameters (name, phone).
   * PATCH /api/v1/users/profile
   */
  updateProfile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        logger.warn('UserController: Profile update failed due to missing req.user.userId');
        throw new UnauthorizedError('Unauthorized access.');
      }

      const validatedBody = updateProfileSchema.parse(req.body);
      const profile = await this.userService.updateProfile(userId, validatedBody);

      res.status(200).json(
        ResponseDto.success('User profile updated successfully.', profile)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * HTTP handler to modify user password.
   * PATCH /api/v1/users/change-password
   */
  changePassword = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        logger.warn('UserController: Password change failed due to missing req.user.userId');
        throw new UnauthorizedError('Unauthorized access.');
      }

      const validatedBody = changePasswordSchema.parse(req.body);
      await this.userService.changePassword(userId, validatedBody);

      res.status(200).json(
        ResponseDto.success('Password changed successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * HTTP handler to upload and update user profile avatar image.
   * PATCH /api/v1/users/profile-image
   */
  updateAvatar = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        logger.warn('UserController: Avatar upload failed due to missing req.user.userId');
        throw new UnauthorizedError('Unauthorized access.');
      }

      if (!req.file) {
        logger.warn('UserController: Avatar upload failed due to missing req.file');
        throw new BadRequestError('Profile image file is required.');
      }

      const profile = await this.userService.updateAvatar(userId, req.file);

      res.status(200).json(
        ResponseDto.success('Profile image updated successfully.', profile)
      );
    } catch (error) {
      next(error);
    }
  };
}

export default UserController;
