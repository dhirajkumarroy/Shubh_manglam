import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticateRequest } from '../../middlewares/auth.middleware';
import { uploadAvatar } from '../../middlewares/upload.middleware';

const router = Router();
const controller = new UserController();

/**
 * @openapi
 * /users/profile:
 *   get:
 *     summary: Get user profile details
 *     description: Retrieves the profile details of the authenticated user.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User profile retrieved successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: ae2921ef-f97d-49db-8bfe-99ad98c54842
 *                     email:
 *                       type: string
 *                       example: dhiraj@example.com
 *                     phone:
 *                       type: string
 *                       example: "9900000001"
 *                     name:
 *                       type: string
 *                       example: Dhiraj
 *                     role:
 *                       type: string
 *                       example: CUSTOMER
 *                     isEmailVerified:
 *                       type: boolean
 *                       example: true
 *                     avatar:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *       401:
 *         description: Unauthorized. Authentication token is missing, invalid, or expired.
 *       404:
 *         description: User profile not found.
 */
router.get('/profile', authenticateRequest, controller.getProfile);

/**
 * @openapi
 * /users/profile:
 *   patch:
 *     summary: Update user profile details
 *     description: Updates the profile details (name and phone number) of the authenticated user.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Dhiraj Kumar
 *               phone:
 *                 type: string
 *                 example: "+919900000002"
 *     responses:
 *       200:
 *         description: User profile updated successfully.
 *       400:
 *         description: Validation payload error.
 *       401:
 *         description: Unauthorized. Authentication token is missing, invalid, or expired.
 *       409:
 *         description: Conflict. Phone number is already registered by another user.
 */
router.patch('/profile', authenticateRequest, controller.updateProfile);

/**
 * @openapi
 * /users/change-password:
 *   patch:
 *     summary: Change user password
 *     description: Changes the password of the authenticated user after validating the current password.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: NewPassword@123
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: UpdatedPassword@123
 *     responses:
 *       200:
 *         description: Password changed successfully.
 *       400:
 *         description: Validation payload error, invalid current password, or new password same as current password.
 *       401:
 *         description: Unauthorized. Authentication token is missing, invalid, or expired.
 *       404:
 *         description: User not found.
 */
router.patch('/change-password', authenticateRequest, controller.changePassword);

/**
 * @openapi
 * /users/profile-image:
 *   patch:
 *     summary: Upload profile image
 *     description: Uploads a JPEG, PNG, or WebP avatar image (max 5 MB) and associates it with the authenticated user. Removes the old avatar if it exists.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file (JPEG, PNG, WebP, max 5 MB)
 *     responses:
 *       200:
 *         description: Profile image updated successfully.
 *       400:
 *         description: Validation payload error, invalid file type, or file too large.
 *       401:
 *         description: Unauthorized. Authentication token is missing, invalid, or expired.
 *       404:
 *         description: User not found.
 */
router.patch('/profile-image', authenticateRequest, uploadAvatar, controller.updateAvatar);

export default router;


