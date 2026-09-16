import { z } from 'zod';

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid notification ID format.'),
});

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});
