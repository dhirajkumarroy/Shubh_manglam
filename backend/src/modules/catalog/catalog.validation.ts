import { z } from 'zod';
import { PricingType } from '@prisma/client';

// =========================================================================
// Service Validation Schemas
// =========================================================================

export const createServiceSchema = z
  .object({
    categoryId: z.string().uuid('Invalid Category ID format.'),
    subcategoryId: z.string().uuid('Invalid Subcategory ID format.').nullable().optional(),
    eventTypeId: z.string().uuid('Invalid Event Type ID format.').nullable().optional(),
    name: z.string().min(2, 'Service name must be at least 2 characters').max(120),
    description: z.string().max(3000).optional(),
    pricingType: z.nativeEnum(PricingType, {
      errorMap: () => ({ message: 'Invalid pricing type.' }),
    }),
    basePrice: z.number().min(0, 'Base price cannot be negative').optional(),
    minPrice: z.number().min(0, 'Minimum price cannot be negative').optional(),
    maxPrice: z.number().min(0, 'Maximum price cannot be negative').optional(),
    minQuantity: z.number().int().min(1, 'Minimum quantity must be at least 1').optional(),
    maxQuantity: z.number().int().min(1, 'Maximum quantity must be at least 1').optional(),
    durationMinutes: z.number().int().min(1, 'Duration must be at least 1 minute').optional(),
    isAvailable: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    // 1. If not CUSTOM_QUOTE, basePrice is mandatory and must be > 0
    if (data.pricingType !== PricingType.CUSTOM_QUOTE) {
      if (data.basePrice === undefined || data.basePrice === null || data.basePrice <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Base price is required and must be greater than 0 for pricing type ${data.pricingType}.`,
          path: ['basePrice'],
        });
      }
    }

    // 2. minPrice <= maxPrice if both given
    if (data.minPrice !== undefined && data.maxPrice !== undefined) {
      if (data.maxPrice < data.minPrice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Maximum price must be greater than or equal to minimum price.',
          path: ['maxPrice'],
        });
      }
    }

    // 3. minQuantity <= maxQuantity if both given
    if (data.minQuantity !== undefined && data.maxQuantity !== undefined) {
      if (data.maxQuantity < data.minQuantity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Maximum quantity must be greater than or equal to minimum quantity.',
          path: ['maxQuantity'],
        });
      }
    }
  });

export const updateServiceSchema = z
  .object({
    categoryId: z.string().uuid('Invalid Category ID format.').optional(),
    subcategoryId: z.string().uuid('Invalid Subcategory ID format.').nullable().optional(),
    eventTypeId: z.string().uuid('Invalid Event Type ID format.').nullable().optional(),
    name: z.string().min(2, 'Service name must be at least 2 characters').max(120).optional(),
    description: z.string().max(3000).optional(),
    pricingType: z.nativeEnum(PricingType).optional(),
    basePrice: z.number().min(0, 'Base price cannot be negative').optional(),
    minPrice: z.number().min(0, 'Minimum price cannot be negative').optional(),
    maxPrice: z.number().min(0, 'Maximum price cannot be negative').optional(),
    minQuantity: z.number().int().min(1).optional(),
    maxQuantity: z.number().int().min(1).optional(),
    durationMinutes: z.number().int().min(1).optional(),
    isAvailable: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.minPrice !== undefined && data.maxPrice !== undefined) {
      if (data.maxPrice < data.minPrice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Maximum price must be greater than or equal to minimum price.',
          path: ['maxPrice'],
        });
      }
    }
    if (data.minQuantity !== undefined && data.maxQuantity !== undefined) {
      if (data.maxQuantity < data.minQuantity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Maximum quantity must be greater than or equal to minimum quantity.',
          path: ['maxQuantity'],
        });
      }
    }
  });

// =========================================================================
// Image Validation Schemas
// =========================================================================

export const createServiceImageSchema = z.object({
  url: z.string().min(1, 'Image URL or path is required.'),
  publicId: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isPrimary: z.boolean().optional(),
});

export const updateServiceImageSchema = z.object({
  sortOrder: z.number().int().min(0).optional(),
  isPrimary: z.boolean().optional(),
});

// =========================================================================
// Package Validation Schemas
// =========================================================================

export const packageServiceInputSchema = z.object({
  serviceId: z.string().uuid('Invalid Service ID format.'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
});

export const createPackageSchema = z
  .object({
    name: z.string().min(2, 'Package name must be at least 2 characters').max(120),
    description: z.string().max(3000).optional(),
    price: z.number().min(0, 'Package price cannot be negative'),
    originalPrice: z.number().min(0, 'Original price cannot be negative').optional(),
    durationMinutes: z.number().int().min(1).optional(),
    isActive: z.boolean().optional(),
    services: z
      .array(packageServiceInputSchema)
      .min(1, 'Package must include at least one service.'),
  })
  .superRefine((data, ctx) => {
    if (data.originalPrice !== undefined && data.originalPrice < data.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Original price (MRP) must be greater than or equal to the discounted package price.',
        path: ['originalPrice'],
      });
    }
  });

export const updatePackageSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    description: z.string().max(3000).optional(),
    price: z.number().min(0).optional(),
    originalPrice: z.number().min(0).optional(),
    durationMinutes: z.number().int().min(1).optional(),
    isActive: z.boolean().optional(),
    services: z.array(packageServiceInputSchema).min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.price !== undefined && data.originalPrice !== undefined && data.originalPrice < data.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Original price must be greater than or equal to the discounted price.',
        path: ['originalPrice'],
      });
    }
  });

// =========================================================================
// Query Parameters Schemas
// =========================================================================

export const catalogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().optional(),
  eventTypeId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  pricingType: z.nativeEnum(PricingType).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  isAvailable: z.preprocess((val) => {
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false) return false;
    return undefined;
  }, z.boolean().optional()),
  isActive: z.preprocess((val) => {
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false) return false;
    return undefined;
  }, z.boolean().optional()),
  city: z.string().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'name_asc', 'newest']).optional(),
});
