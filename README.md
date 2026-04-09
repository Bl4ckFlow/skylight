# Skylight SaaS

Gestion stock/clients/commandes/factures multi-tenant.

## Backend

```bash
cd backend
npm install
cp .env.example .env  # DATABASE_URL=postgres://... JWT_SECRET=... SMTP_* FRONTEND_URL=http://localhost:3000
npm run dev  # http://localhost:4000/api/health
```

## Frontend
```bash
cd frontend
npm install
npm run dev # http://localhost:3000
```

## Docker (Postgres)
docker-compose up db

## Endpoints
- POST /api/auth/login {email, password}
- POST /api/clients (Zod validated)
- Rate-limited, Helmet secured.

Tests: `npm test`

