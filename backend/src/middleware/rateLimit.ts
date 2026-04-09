import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Trop de requêtes, réessayez dans 15min' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip health/auth
    return ['/health', '/auth/login'].some(p => req.path.includes(p));
  },
});

