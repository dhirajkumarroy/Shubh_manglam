import apiClient from './client';
import { Vehicle, VehiclesResponse } from '../types/vehicle';

export const vehicleService = {
  /**
   * Fetches paginated, filtered listings of active vehicles from the backend.
   */
  async getVehicles(params?: {
    page?: number;
    limit?: number;
    search?: string;
    city?: string;
    fuelType?: string;
    transmission?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<VehiclesResponse> {
    const response = await apiClient.get('/vehicles', { params });
    return response.data.data;
  },

  /**
   * Fetches specific vehicle metadata by database UUID.
   */
  async getVehicleById(id: string): Promise<Vehicle> {
    const response = await apiClient.get(`/vehicles/${id}`);
    return response.data.data;
  },
};

export default vehicleService;
