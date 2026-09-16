import { Notification, NotificationType } from '@prisma/client';
import prisma from '../../config/database';

export class NotificationRepository {
  /**
   * Creates a new notification record.
   */
  async create(
    userId: string,
    data: { title: string; message: string; type: NotificationType }
  ): Promise<Notification> {
    return prisma.notification.create({
      data: {
        userId,
        title: data.title,
        message: data.message,
        type: data.type,
        isRead: false,
      },
    });
  }

  /**
   * Find notification by UUID.
   */
  async findById(id: string): Promise<Notification | null> {
    return prisma.notification.findUnique({
      where: { id },
    });
  }

  /**
   * Lists paginated notifications of a user, sorted newest first.
   */
  async listByUser(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ total: number; notifications: Notification[] }> {
    const where = { userId };

    const [total, notifications] = await prisma.$transaction([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, notifications };
  }

  /**
   * Returns count of unread notifications for a user.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Marks a single notification as read.
   */
  async markAsRead(id: string): Promise<Notification> {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Marks all unread notifications of a user as read.
   */
  async markAllAsRead(userId: string): Promise<any> {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  /**
   * Deletes a notification by UUID.
   */
  async delete(id: string): Promise<Notification> {
    return prisma.notification.delete({
      where: { id },
    });
  }
}

export default NotificationRepository;
