import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { ResponseDto } from '../common/dto/api-response.dto';

export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: ResponseDto.error(
    'Too many requests from this IP, please try again after 15 minutes.'
  ),
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Strict rate limiter for sensitive authentication endpoints (brute-force defense).
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'test' ? 1000 : 30, // 30 attempts per 15 minutes in production
  standardHeaders: true,
  legacyHeaders: false,
  message: ResponseDto.error(
    'Too many authentication attempts from this IP, please try again after 15 minutes.'
  ),
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

export default rateLimiter;
