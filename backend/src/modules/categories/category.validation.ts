import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(1000).optional(),
  icon: z.string().max(255).optional(),
  image: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  description: z.string().max(1000).optional(),
  icon: z.string().max(255).optional(),
  image: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});
