import { z } from 'zod';
import { updateProfileSchema, changePasswordSchema } from './user.validation';

export type UpdateProfileRequestDto = z.infer<typeof updateProfileSchema>;
export type ChangePasswordRequestDto = z.infer<typeof changePasswordSchema>;


