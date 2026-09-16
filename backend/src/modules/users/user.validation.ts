import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name cannot exceed 100 characters')
    .optional(),
  
  phone: z
    .string()
    .trim()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number cannot exceed 15 digits')
    .regex(/^\+?\d+$/, 'Phone number must contain only digits (optionally starting with +)')
    .optional(),
});

const passwordComplexity = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=\[\]{}|\\:;"'<>,.?/~`]).*$/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

export const changePasswordSchema = z.object({
  oldPassword: z
    .string({ required_error: 'Old password is required' })
    .min(1, 'Old password cannot be empty'),
  
  newPassword: passwordComplexity,
});

