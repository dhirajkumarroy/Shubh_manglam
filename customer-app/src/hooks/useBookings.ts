import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import bookingService from '../api/booking.service';
import { CreateBookingPayload } from '../types/booking';

/**
 * Hook to retrieve a paginated, filtered customer booking list.
 */
export const useMyBookings = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['myBookings', params],
    queryFn: () => bookingService.getMyBookings(params),
  });
};

/**
 * Hook to retrieve specific booking detailed parameters by database ID.
 */
export const useBooking = (id: string) => {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingService.getBookingById(id),
    enabled: !!id,
  });
};

/**
 * Mutation hook to register/create a new vehicle booking listing request.
 */
export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => bookingService.createBooking(payload),
    onSuccess: () => {
      // Invalidate customer bookings list queries to trigger refresh auto update
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] }); // Invalidate vehicles to update availability statuses
    },
  });
};
