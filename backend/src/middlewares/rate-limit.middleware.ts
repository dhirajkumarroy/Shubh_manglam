import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { ResponseDto } from '../common/dto/api-response.dto';

export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: ResponseDto.error(
    'Too many requests from this IP, please try again after 15 minutes.'
  ),
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

export default rateLimiter;
