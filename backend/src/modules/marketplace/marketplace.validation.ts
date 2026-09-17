import { z } from 'zod';

export const marketplaceVendorQuerySchema = z.object({
  eventType: z.string().optional(),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().positive().max(500).optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  search: z.string().optional(),
  q: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sort: z.enum(['nearest', 'rating', 'newest', 'relevance']).optional().default('rating'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const marketplaceCategoryQuerySchema = z.object({
  eventTypeId: z.string().optional(),
  search: z.string().optional(),
});

export const marketplaceServiceQuerySchema = z.object({
  categoryId: z.string().optional(),
  vendorId: z.string().optional(),
  eventTypeId: z.string().optional(),
  search: z.string().optional(),
  city: z.string().optional(),
  pricingType: z.enum(['FIXED', 'PER_PERSON', 'PER_UNIT', 'PER_DAY', 'PER_HOUR', 'CUSTOM_QUOTE']).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'popular', 'rating', 'newest']).optional().default('newest'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const marketplacePackageQuerySchema = z.object({
  vendorId: z.string().optional(),
  categoryId: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'newest']).optional().default('newest'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});
