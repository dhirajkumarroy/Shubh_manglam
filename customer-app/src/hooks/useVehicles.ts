import { useQuery } from '@tanstack/react-query';
import vehicleService from '../api/vehicle.service';

/**
 * Hook to retrieve a paginated, filtered vehicle list from the backend.
 */
export const useVehicles = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  fuelType?: string;
  transmission?: string;
  minPrice?: number;
  maxPrice?: number;
}) => {
  return useQuery({
    queryKey: ['vehicles', params],
    queryFn: () => vehicleService.getVehicles(params),
  });
};

/**
 * Hook to retrieve specific vehicle details by database ID.
 */
export const useVehicle = (id: string) => {
  return useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehicleService.getVehicleById(id),
    enabled: !!id, // Prevent query execution if ID is empty
  });
};
