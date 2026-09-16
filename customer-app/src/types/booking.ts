import { Vehicle, VehicleOwner } from './vehicle';

export interface Booking {
  id: string;
  vehicleId: string;
  customerId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'ACCEPTED';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle?: Vehicle;
  customer?: VehicleOwner;
}

export interface CreateBookingPayload {
  vehicleId: string;
  startDate: string; // ISO string format or YYYY-MM-DD
  endDate: string;
  notes?: string;
}

export interface MyBookingsResponse {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  bookings: Booking[];
}
