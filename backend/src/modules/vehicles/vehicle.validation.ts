import { z } from 'zod';
import { FuelType, Transmission, VehicleCategory } from '@prisma/client';

export const createVehicleSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100),
  brand: z.string().min(1, 'Brand is required').max(50),
  model: z.string().min(1, 'Model is required').max(50),
  year: z.coerce.number().int().min(1800).max(new Date().getFullYear() + 1),
  vehicleNumber: z.string().min(3, 'Vehicle number must be at least 3 characters').max(30),
  fuelType: z.nativeEnum(FuelType, { errorMap: () => ({ message: 'Invalid fuel type' }) }),
  transmission: z.nativeEnum(Transmission, { errorMap: () => ({ message: 'Invalid transmission type' }) }),
  category: z.nativeEnum(VehicleCategory).default(VehicleCategory.CAR),
  operatingLatitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  operatingLongitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  operatingRadius: z.coerce.number().positive().optional().nullable(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
});

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  isAvailable: z.preprocess(
    (val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    },
    z.boolean().optional()
  ),
});

export const vehicleQuerySchema = z.object({
  brand: z.string().optional(),
  fuelType: z.nativeEnum(FuelType).optional(),
  transmission: z.nativeEnum(Transmission).optional(),
  category: z.nativeEnum(VehicleCategory).optional(),
  isAvailable: z.preprocess(
    (val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    },
    z.boolean().optional()
  ),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  sort: z.enum(['newest', 'oldest']).default('newest'),
});
