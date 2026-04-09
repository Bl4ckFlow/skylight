import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes      from './modules/auth/auth.routes';
import stockRoutes     from './modules/stock/stock.routes';
import clientsRoutes   from './modules/clients/clients.routes';
import commandesRoutes from './modules/commandes/commandes.routes';
import facturesRoutes  from './modules/factures/factures.routes';
import adminRoutes     from './modules/admin/admin.routes';
import settingsRoutes   from './modules/settings/settings.routes';
import dashboardRoutes  from './modules/dashboard/dashboard.routes';

dotenv.config();

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = [
      /^https:\/\/.*\.vercel\.app$/,
      /^http:\/\/localhost:(3000|3001)$/,
    ];
    if (process.env.FRONTEND_URL) allowed.push(new RegExp(`^${process.env.FRONTEND_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
    if (allowed.some(r => r.test(origin))) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth',      authRoutes);
app.use('/api/stock',     stockRoutes);
app.use('/api/clients',   clientsRoutes);
app.use('/api/commandes', commandesRoutes);
app.use('/api/factures',  facturesRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/settings',   settingsRoutes);
app.use('/api/dashboard',  dashboardRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Skylight API running on http://localhost:${PORT}`);
});

export default app;
