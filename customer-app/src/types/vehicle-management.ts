import { Vehicle } from './vehicle';
import { Booking } from './booking';

export interface OwnerVehiclesResponse {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  vehicles: Vehicle[];
}

export interface OwnerBookingsResponse {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  bookings: Booking[];
}

export interface CreateVehiclePayload {
  title: string;
  brand: string;
  model: string;
  year: number;
  vehicleNumber: string;
  fuelType: 'PETROL' | 'DIESEL' | 'CNG' | 'ELECTRIC' | 'HYBRID';
  transmission: 'MANUAL' | 'AUTOMATIC';
  category: 'BIKE' | 'AUTO' | 'CAR' | 'SUV' | 'PICKUP' | 'MINI_TRUCK' | 'TRACTOR' | 'BUS' | 'LUXURY_CAR';
  operatingLatitude?: number | null;
  operatingLongitude?: number | null;
  operatingRadius?: number | null;
  description: string;
  isAvailable?: boolean;
}

export type UpdateVehiclePayload = Partial<CreateVehiclePayload>;
