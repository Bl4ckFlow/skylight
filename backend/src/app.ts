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

import { errorHandler } from './middleware/errorHandler';
import { apiLimiter }   from './middleware/rateLimit';

dotenv.config();

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
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
app.use(apiLimiter as any);

// Routes
app.use('/api/auth',      authRoutes);
app.use('/api/stock',     stockRoutes);
app.use('/api/clients',   clientsRoutes);
app.use('/api/commandes', commandesRoutes);
app.use('/api/factures',  facturesRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/settings',  settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(Number(PORT), '0.0.0.0', () => {
  logger.info(`🚀 Skylight API on port ${PORT}`);
});

export default app;
