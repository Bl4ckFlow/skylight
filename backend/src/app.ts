import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes      from './modules/auth/auth.routes';
import stockRoutes     from './modules/stock/stock.routes';
import clientsRoutes   from './modules/clients/clients.routes';
import commandesRoutes from './modules/commandes/commandes.routes';
import facturesRoutes  from './modules/factures/factures.routes';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : /^http:\/\/localhost:(3000|3001)$/,
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth',      authRoutes);
app.use('/api/stock',     stockRoutes);
app.use('/api/clients',   clientsRoutes);
app.use('/api/commandes', commandesRoutes);
app.use('/api/factures',  facturesRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Skylight API running on http://localhost:${PORT}`);
});

export default app;
