import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticateRequest } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new NotificationController();

/**
 * @openapi
 * /notifications:
 *   get:
 *     summary: Retrieve user notifications
 *     description: Returns a paginated list of notifications of the logged-in user, sorted newest first.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Notifications list retrieved successfully.
 *       401:
 *         description: Unauthorized.
 */
router.get('/', authenticateRequest, controller.listNotifications);

/**
 * @openapi
 * /notifications/unread-count:
 *   get:
 *     summary: Get unread notifications count
 *     description: Returns the total count of unread notifications for the authenticated user.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully.
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
 *                   example: Unread notification count retrieved successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Unauthorized.
 */
router.get('/unread-count', authenticateRequest, controller.getUnreadCount);

/**
 * @openapi
 * /notifications/read-all:
 *   patch:
 *     summary: Mark all user notifications as read
 *     description: Marks all unread notifications of the logged-in user as read.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully.
 *       401:
 *         description: Unauthorized.
 */
router.patch('/read-all', authenticateRequest, controller.markAllAsRead);

/**
 * @openapi
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     description: Marks a single notification as read by its UUID. User can only read their own notifications.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification marked as read successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden. Notification does not belong to the authenticated user.
 *       404:
 *         description: Notification not found.
 */
router.patch('/:id/read', authenticateRequest, controller.markAsRead);

/**
 * @openapi
 * /notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     description: Deletes a user notification by its UUID. User can only delete their own notifications.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden. Notification does not belong to the authenticated user.
 *       404:
 *         description: Notification not found.
 */
router.delete('/:id', authenticateRequest, controller.deleteNotification);

export default router;
