import rateLimit from 'express-rate-limit';

// Standard API rate limiter: 100 requests per 15 minutes in production
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // Generous limit for normal usage
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again after 15 minutes',
    },
  },
  skip: () => process.env.NODE_ENV === 'test',
});

// Stricter rate limiter for auth endpoints (brute-force protection)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again after 15 minutes',
    },
  },
  skip: () => process.env.NODE_ENV === 'test',
});
