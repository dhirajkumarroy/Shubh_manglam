import apiClient from './client';
import {
  CreateOrderResponse,
  VerifyPaymentPayload,
  VerifyPaymentResponse,
  Payment,
  MyPaymentsResponse,
} from '../types/payment';

export const paymentService = {
  /**
   * Generates a new Razorpay order for a pending booking.
   */
  async createOrder(bookingId: string): Promise<CreateOrderResponse> {
    const response = await apiClient.post('/payments/create-order', { bookingId });
    return response.data.data;
  },

  /**
   * Cryptographically verifies payment signature from client checkout.
   */
  async verifyPayment(payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> {
    const response = await apiClient.post('/payments/verify', payload);
    return response.data.data;
  },

  /**
   * Retrieves detailed payment status metadata by ID.
   */
  async getPayment(id: string): Promise<Payment> {
    const response = await apiClient.get(`/payments/${id}`);
    return response.data.data;
  },

  /**
   * Lists customer payments history.
   */
  async getMyPayments(params?: { page?: number; limit?: number }): Promise<MyPaymentsResponse> {
    const response = await apiClient.get('/payments/my', { params });
    return response.data.data;
  },

  /**
   * Confirms reservation with Cash on Delivery mode.
   */
  async payWithCOD(bookingId: string): Promise<any> {
    const response = await apiClient.post('/payments/cod', { bookingId });
    return response.data.data;
  },
};

export default paymentService;
