import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { ResponseDto } from '../common/dto/api-response.dto';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000; // 24 hours (86,400,000 ms)

export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS || TWENTY_FOUR_HOURS_MS,
  max: env.NODE_ENV === 'production' ? env.RATE_LIMIT_MAX : 50000,
  standardHeaders: true,
  legacyHeaders: false,
  message: ResponseDto.error(
    'Too many requests from this IP, please try again after 24 hours.'
  ),
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Strict rate limiter for sensitive authentication endpoints (brute-force defense).
 */
export const authLimiter = rateLimit({
  windowMs: TWENTY_FOUR_HOURS_MS, // 24 hours
  max: env.NODE_ENV === 'production' ? 50 : 2000, // 50 attempts in prod per 24h, 2000 in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: ResponseDto.error(
    'Too many authentication attempts from this IP, please try again after 24 hours.'
  ),
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

export default rateLimiter;
