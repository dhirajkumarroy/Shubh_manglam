import { z } from 'zod';
import { userQuerySchema } from './admin.validation';

export type UserQueryDto = z.infer<typeof userQuerySchema>;
