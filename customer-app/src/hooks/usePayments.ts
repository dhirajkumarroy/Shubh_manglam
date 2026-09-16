import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import paymentService from '../api/payment.service';
import { VerifyPaymentPayload } from '../types/payment';

/**
 * Hook to retrieve specific payment metadata by database ID.
 */
export const usePayment = (id: string) => {
  return useQuery({
    queryKey: ['payment', id],
    queryFn: () => paymentService.getPayment(id),
    enabled: !!id,
  });
};

/**
 * Hook to retrieve user payments list.
 */
export const useMyPayments = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['myPayments', params],
    queryFn: () => paymentService.getMyPayments(params),
  });
};

/**
 * Mutation hook to initiate order creation on backend.
 */
export const useCreateOrder = () => {
  return useMutation({
    mutationFn: (bookingId: string) => paymentService.createOrder(bookingId),
  });
};

/**
 * Mutation hook to cryptographically verify payment signatures and confirm booking.
 */
export const useVerifyPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VerifyPaymentPayload) => paymentService.verifyPayment(payload),
    onSuccess: (data) => {
      // Invalidate bookings lists and details, and payment histories
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', data.booking.id] });
      queryClient.invalidateQueries({ queryKey: ['myPayments'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
};

/**
 * Mutation hook to confirm reservation using Cash on Delivery.
 */
export const usePayWithCOD = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => paymentService.payWithCOD(bookingId),
    onSuccess: (data) => {
      // Invalidate bookings lists and details, and payment histories
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', data.booking.id] });
      queryClient.invalidateQueries({ queryKey: ['myPayments'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
};
