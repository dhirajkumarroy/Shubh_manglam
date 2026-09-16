import { z } from 'zod';
import { VehicleStatus, RequestStatus } from '@prisma/client';

export const userQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  email: z.string().optional(),
  name: z.string().optional(),
});

export const vehicleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.nativeEnum(VehicleStatus).optional(),
  city: z.string().optional(),
  brand: z.string().optional(),
});

export const bookingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.nativeEnum(RequestStatus).optional(),
  vehicleId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format. Must be a valid UUID.'),
});
