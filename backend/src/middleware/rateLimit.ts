import rateLimit from 'express-rate-limit';

// General API limiter — 200 req/15min per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Trop de requêtes, réessayez dans 15min' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip file downloads only — not API calls
    return (
      req.path.includes('/health') ||
      req.path.endsWith('/pdf') ||
      req.path.endsWith('/bl') ||
      req.path.endsWith('/export.xlsx')
    );
  },
});

// Strict limiter for login — 10 attempts/15min per IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives de connexion, réessayez dans 15min' },
  standardHeaders: true,
  legacyHeaders: false,
});
