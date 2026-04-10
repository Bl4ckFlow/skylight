import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import winston from 'winston';

import authRoutes      from './modules/auth/auth.routes';
import stockRoutes     from './modules/stock/stock.routes';
import clientsRoutes   from './modules/clients/clients.routes';
import commandesRoutes from './modules/commandes/commandes.routes';
import facturesRoutes  from './modules/factures/factures.routes';
import adminRoutes     from './modules/admin/admin.routes';
import settingsRoutes  from './modules/settings/settings.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';

import cookieParser  from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter }   from './middleware/rateLimit';
import { pool }         from './config/db';

dotenv.config();

// ── Startup env validation ────────────────────────────────────────────────────
const REQUIRED_ENV = ['JWT_SECRET', 'DATABASE_URL', 'FRONTEND_URL'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

// ── Logger ────────────────────────────────────────────────────────────────────
// Logs go to stdout — DigitalOcean captures console output in its log viewer
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

const app = express();

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed: RegExp[] = [
      /^https:\/\/.*\.vercel\.app$/,
      /^http:\/\/localhost:(3000|3001)$/,
    ];
    if (process.env.FRONTEND_URL) {
      allowed.push(new RegExp(`^${process.env.FRONTEND_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
    }
    if (allowed.some(r => r.test(origin))) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(apiLimiter);

// ── Request logging ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
    } else {
      logger.info(`${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
    }
  });
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',      authRoutes);
app.use('/api/v1/stock',     stockRoutes);
app.use('/api/v1/clients',   clientsRoutes);
app.use('/api/v1/commandes', commandesRoutes);
app.use('/api/v1/factures',  facturesRoutes);
app.use('/api/v1/admin',     adminRoutes);
app.use('/api/v1/settings',  settingsRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'unhealthy', error: 'Database unreachable' });
  }
});

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
const server = app.listen(Number(PORT), '0.0.0.0', () => {
  logger.info(`🚀 Skylight API on port ${PORT}`);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = async (signal: string) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    await pool.end();
    logger.info('Database pool closed');
    process.exit(0);
  });
  // Force exit after 10s if requests don't drain
  setTimeout(() => process.exit(1), 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

export default app;
