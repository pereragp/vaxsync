import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for report generation
 */
export const reportGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 report generations per hour
  message: {
    success: false,
    message: 'Too many report generation requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Download rate limiter
 */
export const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 downloads per 15 minutes
  message: {
    success: false,
    message: 'Too many download requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});