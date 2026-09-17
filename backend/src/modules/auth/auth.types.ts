import { z } from 'zod';
import {
  customerRegisterSchema,
  providerRegisterSchema,
  registerSchema,
  loginSchema,
  adminLoginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  logoutSchema,
  googleAuthSchema,
  adminMfaVerifySchema,
  adminMfaDisableSchema,
} from './auth.validation';

export type CustomerRegisterDto = z.infer<typeof customerRegisterSchema>;
export type ProviderRegisterDto = z.infer<typeof providerRegisterSchema>;
export type RegisterRequestDto = z.infer<typeof registerSchema>;
export type LoginRequestDto = z.infer<typeof loginSchema>;
export type AdminLoginRequestDto = z.infer<typeof adminLoginSchema>;
export type VerifyEmailRequestDto = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationDto = z.infer<typeof resendVerificationSchema>;
export type RefreshTokenRequestDto = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordRequestDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequestDto = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordRequestDto = z.infer<typeof changePasswordSchema>;
export type LogoutRequestDto = z.infer<typeof logoutSchema>;
export type GoogleAuthDto = z.infer<typeof googleAuthSchema>;
export type AdminMfaVerifyDto = z.infer<typeof adminMfaVerifySchema>;
export type AdminMfaDisableDto = z.infer<typeof adminMfaDisableSchema>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    avatar?: string | null;
  };
  vendor?: {
    id: string;
    businessName: string;
    slug: string;
    status: string;
    isVerified: boolean;
    isActive: boolean;
  } | null;
  tokens?: AuthTokens;
  mfaRequired?: boolean;
  tempToken?: string;
}
