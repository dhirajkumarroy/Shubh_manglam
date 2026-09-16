export type NotificationType =
  | 'BOOKING_REQUEST'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_CANCELLED'
  | 'SYSTEM'
  | 'EMAIL'
  | 'BOOKING';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  notifications: Notification[];
}

export interface UnreadCountResponse {
  count: number;
}
