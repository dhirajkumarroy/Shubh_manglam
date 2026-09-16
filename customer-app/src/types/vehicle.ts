export interface VehicleImage {
  id: string;
  vehicleId: string;
  imageUrl: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface VehicleOwner {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
}

export interface Vehicle {
  id: string;
  ownerId: string;
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
  seatCapacity?: number;
  pricePerDay?: number;
  city?: string;
  latitude?: number;
  longitude?: number;
  description: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  images: VehicleImage[];
  owner: VehicleOwner;
}

export interface VehiclesResponse {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  vehicles: Vehicle[];
}
