import { z } from 'zod';

export const createCategorySchema = z.object({
  parentId: z.string().uuid('Invalid parent Category ID format').nullable().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(1000).optional(),
  icon: z.string().max(255).optional(),
  image: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = z.object({
  parentId: z.string().uuid('Invalid parent Category ID format').nullable().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  description: z.string().max(1000).optional(),
  icon: z.string().max(255).optional(),
  image: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const categoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
  isActive: z.preprocess((val) => {
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false) return false;
    return undefined;
  }, z.boolean().optional()),
});
