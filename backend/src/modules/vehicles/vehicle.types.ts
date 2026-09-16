import { z } from 'zod';
import { createVehicleSchema, updateVehicleSchema, vehicleQuerySchema } from './vehicle.validation';

export type CreateVehicleDto = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleDto = z.infer<typeof updateVehicleSchema>;
export type VehicleQueryDto = z.infer<typeof vehicleQuerySchema>;
