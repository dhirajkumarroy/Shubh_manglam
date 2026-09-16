import { z } from 'zod';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  logoutSchema,
} from './auth.validation';

export type RegisterRequestDto = z.infer<typeof registerSchema>;
export type LoginRequestDto = z.infer<typeof loginSchema>;
export type VerifyEmailRequestDto = z.infer<typeof verifyEmailSchema>;
export type RefreshTokenRequestDto = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordRequestDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequestDto = z.infer<typeof resetPasswordSchema>;
export type LogoutRequestDto = z.infer<typeof logoutSchema>;




