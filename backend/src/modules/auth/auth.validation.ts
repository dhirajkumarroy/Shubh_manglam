import { z } from 'zod';
import { env } from '../../config/env';

// Password complexity validation rules (strict in production, friendly in dev/test)
export const passwordComplexity =
  env.NODE_ENV === 'production'
    ? z
        .string({ required_error: 'Password is required' })
        .min(8, 'Password must be at least 8 characters long')
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=\[\]{}|\\:;"'<>,.?/~`]).*$/,
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        )
    : z
        .string({ required_error: 'Password is required' })
        .min(6, 'Password must be at least 6 characters long');

// Customer Registration
export const customerRegisterSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(1, 'Name cannot be empty'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address format')
    .toLowerCase(),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number cannot exceed 15 digits')
    .regex(/^\+?\d+$/, 'Phone number must contain only digits (optionally starting with +)'),
  password: passwordComplexity,
});

// Provider Registration (Creates User role VENDOR + Vendor profile in PENDING status)
export const providerRegisterSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(1, 'Name cannot be empty'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address format')
    .toLowerCase(),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number cannot exceed 15 digits')
    .regex(/^\+?\d+$/, 'Phone number must contain only digits (optionally starting with +)'),
  password: passwordComplexity,
  businessName: z
    .string({ required_error: 'Business name is required' })
    .trim()
    .min(2, 'Business name must be at least 2 characters long'),
  city: z.string().trim().optional(),
});

// Login Schemas
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address format')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty'),
});

export const adminLoginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address format')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty'),
  mfaCode: z
    .string()
    .trim()
    .length(6, 'MFA code must be exactly 6 digits')
    .regex(/^\d+$/, 'MFA code must contain only digits')
    .optional(),
});

// Email Verification
export const verifyEmailSchema = z.object({
  email: z.string().trim().email().toLowerCase().optional(),
  otp: z.string().trim().length(6).optional(),
  token: z.string().trim().min(10).optional(),
}).refine((data) => data.token || (data.email && data.otp), {
  message: 'Either a verification token or email + OTP is required',
});

export const resendVerificationSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address format')
    .toLowerCase(),
});

// Refresh & Logout
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: 'Refresh token is required' })
    .min(1, 'Refresh token cannot be empty'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

// Password Management
export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address format')
    .toLowerCase(),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email().toLowerCase().optional(),
  otp: z.string().trim().length(6).optional(),
  token: z.string().trim().min(10).optional(),
  newPassword: passwordComplexity,
}).refine((data) => data.token || (data.email && data.otp), {
  message: 'Either a reset token or email + OTP is required',
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Current password is required' })
    .min(1, 'Current password cannot be empty'),
  newPassword: passwordComplexity,
});

// Google OAuth
export const googleAuthSchema = z.object({
  idToken: z
    .string({ required_error: 'Google ID token is required' })
    .min(1, 'ID token cannot be empty'),
  role: z.enum(['CUSTOMER', 'VENDOR']).default('CUSTOMER'),
  email: z.string().trim().email().toLowerCase().optional(),
  name: z.string().trim().optional(),
  avatar: z.string().trim().optional(),
  businessName: z.string().trim().optional(),
});

// Admin MFA
export const adminMfaVerifySchema = z.object({
  code: z
    .string({ required_error: 'TOTP code is required' })
    .trim()
    .length(6, 'TOTP code must be exactly 6 digits')
    .regex(/^\d+$/, 'TOTP code must contain only digits'),
});

export const adminMfaDisableSchema = z.object({
  code: z
    .string({ required_error: 'TOTP code is required' })
    .trim()
    .length(6, 'TOTP code must be exactly 6 digits')
    .regex(/^\d+$/, 'TOTP code must contain only digits'),
  password: z
    .string({ required_error: 'Password is required to disable MFA' })
    .min(1, 'Password cannot be empty'),
});

// Backward compatibility alias
export const registerSchema = customerRegisterSchema;
