import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import notificationService from '../api/notification.service';

/**
 * Hook to retrieve user notifications list.
 */
export const useNotifications = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationService.getNotifications(params),
  });
};

/**
 * Hook to retrieve total unread notifications count.
 * Configured with background polling to automatically update the tab badge.
 */
export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 15000, // Background poll every 15 seconds to keep unread badges updated
    refetchOnWindowFocus: true,
  });
};

/**
 * Mutation hook to mark a single notification as read.
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      // Invalidate queries to update lists and badges
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
};

/**
 * Mutation hook to mark all user notifications as read.
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      // Invalidate queries to update lists and badges
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
};
