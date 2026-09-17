import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables dynamically based on file location, preventing CWD mismatches
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PREFIX: z.string().default('/api/v1'),
  
  DATABASE_URL: z.string({
    required_error: 'DATABASE_URL is required',
  }).url('DATABASE_URL must be a valid connection URL'),
  
  JWT_SECRET: z.string({
    required_error: 'JWT_SECRET is required',
  }).min(8, 'JWT_SECRET must be at least 8 characters long'),
  
  JWT_REFRESH_SECRET: z.string({
    required_error: 'JWT_REFRESH_SECRET is required',
  }).min(8, 'JWT_REFRESH_SECRET must be at least 8 characters long'),
  
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),
  
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 mins
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(25),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('Shubh Mangalam <no-reply@shubhmangalam.com>'),
  
  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),
  
  STORAGE_PROVIDER: z.enum(['local', 'cloudinary']).default('local'),
  UPLOAD_DIR: z.string().default('uploads'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  RAZORPAY_KEY_ID: z.string().default('rzp_test_mockkeyid123'),
  RAZORPAY_KEY_SECRET: z.string().default('mocksecretkey456'),
  RAZORPAY_WEBHOOK_SECRET: z.string().default('mockwebhooksecret789'),

  // Application Origins for CORS
  ADMIN_WEB_ORIGIN: z.string().default('http://localhost:5173'),
  CUSTOMER_APP_ORIGIN: z.string().default('http://localhost:8081'),
  PROVIDER_APP_ORIGIN: z.string().default('http://localhost:8082'),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),

  // MFA & Security
  MFA_ENCRYPTION_KEY: z.string().default('d791609508c549049cd86591d3aad804e123456789abcdef0123456789abcdef'),
  SEED_DEFAULT_PASSWORD: z.string().default('ShubhMangalam@2026!'),
});


const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Environment validation failed:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }
  
  return result.data;
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
