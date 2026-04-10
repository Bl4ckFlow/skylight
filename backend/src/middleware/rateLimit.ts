import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Trop de requêtes, réessayez dans 15min' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip PDF/BL downloads and health check — these are file downloads, not API abuse
    return (
      req.path.includes('/health') ||
      req.path.includes('/auth/login') ||
      req.path.endsWith('/pdf') ||
      req.path.endsWith('/bl')
    );
  },
});
