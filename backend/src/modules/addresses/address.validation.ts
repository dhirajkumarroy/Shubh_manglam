import { z } from 'zod';

export const createAddressSchema = z.object({
  label: z.string().max(50).optional(),
  addressLine1: z.string().min(3, 'Address line 1 must be at least 3 characters').max(255),
  addressLine2: z.string().max(255).optional(),
  village: z.string().max(100).optional(),
  locality: z.string().max(100).optional(),
  city: z.string().min(2, 'City is required').max(100),
  district: z.string().max(100).optional(),
  state: z.string().min(2, 'State is required').max(100),
  country: z.string().max(100).optional().default('India'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be a 6-digit Indian PIN code'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isDefault: z.boolean().optional().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();
