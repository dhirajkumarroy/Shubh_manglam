import apiClient from './client';
import { Booking, CreateBookingPayload, MyBookingsResponse } from '../types/booking';

export const bookingService = {
  /**
   * Posts a new booking reservation request to the backend.
   */
  async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    const response = await apiClient.post('/bookings', payload);
    return response.data.data;
  },

  /**
   * Retrieves paginated bookings requested by the authenticated customer.
   */
  async getMyBookings(params?: { page?: number; limit?: number }): Promise<MyBookingsResponse> {
    const response = await apiClient.get('/bookings/my', { params });
    return response.data.data;
  },

  /**
   * Retrieves single booking detailed parameters by database ID.
   */
  async getBookingById(id: string): Promise<Booking> {
    const response = await apiClient.get(`/bookings/${id}`);
    return response.data.data;
  },
};

export default bookingService;
