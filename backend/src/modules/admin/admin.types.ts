import { z } from 'zod';
import {
  userQuerySchema,
  vehicleQuerySchema,
  bookingQuerySchema,
} from './admin.validation';

export type UserQueryDto = z.infer<typeof userQuerySchema>;
export type VehicleQueryDto = z.infer<typeof vehicleQuerySchema>;
export type BookingQueryDto = z.infer<typeof bookingQuerySchema>;
