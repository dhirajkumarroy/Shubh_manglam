import { z } from 'zod';
import { createRequestSchema, requestQuerySchema } from './request.validation';

export type CreateRequestDto = z.infer<typeof createRequestSchema>;
export type RequestQueryDto = z.infer<typeof requestQuerySchema>;
