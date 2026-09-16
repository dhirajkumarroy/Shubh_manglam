import apiClient from './client';
import {
  NotificationsResponse,
  UnreadCountResponse,
  Notification,
} from '../types/notification';

export const notificationService = {
  /**
   * Retrieves a paginated list of notifications for the authenticated user.
   */
  async getNotifications(params?: { page?: number; limit?: number }): Promise<NotificationsResponse> {
    const response = await apiClient.get('/notifications', { params });
    return response.data.data;
  },

  /**
   * Retrieves the count of unread notifications for the user.
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data.data;
  },

  /**
   * Marks a specific notification as read.
   */
  async markAsRead(id: string): Promise<Notification> {
    const response = await apiClient.patch(`/notifications/${id}/read`);
    return response.data.data;
  },

  /**
   * Marks all unread notifications of the user as read.
   */
  async markAllAsRead(): Promise<{ count: number }> {
    const response = await apiClient.patch('/notifications/read-all');
    return response.data.data;
  },
};

export default notificationService;
