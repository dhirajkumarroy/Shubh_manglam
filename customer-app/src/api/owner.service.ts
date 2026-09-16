import apiClient from './client';
import {
  OwnerVehiclesResponse,
  OwnerBookingsResponse,
  UpdateVehiclePayload,
} from '../types/vehicle-management';
import { Vehicle } from '../types/vehicle';
import { Booking } from '../types/booking';

export const ownerService = {
  /**
   * Retrieves owner registered vehicles list.
   */
  async getMyVehicles(params?: { page?: number; limit?: number }): Promise<OwnerVehiclesResponse> {
    const response = await apiClient.get('/vehicles/my', { params });
    return response.data.data;
  },

  /**
   * Registers a new vehicle under the owner with multi-part images.
   */
  async createVehicle(formData: FormData): Promise<Vehicle> {
    const response = await apiClient.post('/vehicles', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  /**
   * Patches existing vehicle metadata.
   */
  async updateVehicle(id: string, payload: UpdateVehiclePayload): Promise<Vehicle> {
    const response = await apiClient.patch(`/vehicles/${id}`, payload);
    return response.data.data;
  },

  /**
   * Removes/deletes a vehicle listing.
   */
  async deleteVehicle(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/vehicles/${id}`);
    return response.data;
  },

  /**
   * Retrieves paginated bookings received for owner's vehicles.
   */
  async getOwnerBookings(params?: { page?: number; limit?: number }): Promise<OwnerBookingsResponse> {
    const response = await apiClient.get('/bookings/owner', { params });
    return response.data.data;
  },

  /**
   * Approves (confirms) a pending booking request.
   */
  async approveBooking(id: string): Promise<Booking> {
    const response = await apiClient.patch(`/bookings/${id}/confirm`);
    return response.data.data;
  },

  /**
   * Rejects a pending booking request.
   */
  async rejectBooking(id: string): Promise<Booking> {
    const response = await apiClient.patch(`/bookings/${id}/reject`);
    return response.data.data;
  },
};

export default ownerService;
