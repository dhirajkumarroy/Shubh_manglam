import { Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { uuidParamSchema, notificationQuerySchema } from './notification.validation';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { ResponseDto } from '../../common/dto/api-response.dto';
import { UnauthorizedError } from '../../common/utils/app-error';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * List paginated notifications of the logged-in user.
   * GET /api/v1/notifications
   */
  listNotifications = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      const query = notificationQuerySchema.parse(req.query);
      const result = await this.notificationService.listNotifications(
        userId,
        query.page,
        query.limit
      );

      res.status(200).json(
        ResponseDto.success('Notifications retrieved successfully.', result)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get unread notifications count.
   * GET /api/v1/notifications/unread-count
   */
  getUnreadCount = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      const result = await this.notificationService.getUnreadCount(userId);

      res.status(200).json(
        ResponseDto.success('Unread notification count retrieved successfully.', result)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark a single notification as read.
   * PATCH /api/v1/notifications/:id/read
   */
  markAsRead = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      const { id } = uuidParamSchema.parse(req.params);
      const notification = await this.notificationService.markAsRead(id, userId);

      res.status(200).json(
        ResponseDto.success('Notification marked as read successfully.', notification)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark all notifications of a user as read.
   * PATCH /api/v1/notifications/read-all
   */
  markAllAsRead = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      await this.notificationService.markAllAsRead(userId);

      res.status(200).json(
        ResponseDto.success('All notifications marked as read successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a notification.
   * DELETE /api/v1/notifications/:id
   */
  deleteNotification = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      const { id } = uuidParamSchema.parse(req.params);
      await this.notificationService.deleteNotification(id, userId);

      res.status(200).json(
        ResponseDto.success('Notification deleted successfully.')
      );
    } catch (error) {
      next(error);
    }
  };
}

export default NotificationController;
