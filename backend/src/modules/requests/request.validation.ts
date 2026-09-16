import { z } from 'zod';
import { BookingPurpose, VehicleCategory } from '@prisma/client';

export const createRequestSchema = z.object({
  purpose: z.nativeEnum(BookingPurpose, { errorMap: () => ({ message: 'Invalid booking purpose category' }) }),
  description: z.string().min(5, 'Description must be at least 5 characters').max(1000),
  pickupAddress: z.string().min(3, 'Pickup address is required'),
  pickupLatitude: z.coerce.number().min(-90).max(90),
  pickupLongitude: z.coerce.number().min(-180).max(180),
  dropAddress: z.string().min(3, 'Drop address is required'),
  dropLatitude: z.coerce.number().min(-90).max(90),
  dropLongitude: z.coerce.number().min(-180).max(180),
  requiredVehicleCategory: z.nativeEnum(VehicleCategory, { errorMap: () => ({ message: 'Invalid vehicle category selection' }) }),
  scheduledAt: z.coerce.date().refine((date) => date.getTime() > Date.now() - 60000, {
    message: 'Scheduled date and time must be in the future',
  }),
});

export const requestQuerySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});
