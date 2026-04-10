# Skylight

Gestion commerciale SaaS — stock, clients, commandes, factures. Multi-tenant, rôles par module.

## Démarrage rapide (local)

### 1. Base de données (Docker)

```bash
docker-compose up -d db
```

Lance PostgreSQL sur `localhost:5432` et applique automatiquement `database/schema.sql`.

Connexion locale : `postgres://skylight:skylight_dev@localhost:5432/skylight`

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # éditer les valeurs
npm run dev            # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:3000
```

## Variables d'environnement (backend)

| Variable | Description | Requis |
|---|---|---|
| `DATABASE_URL` | URL PostgreSQL | ✅ |
| `JWT_SECRET` | Clé secrète JWT (min. 32 chars) | ✅ |
| `PORT` | Port du serveur (défaut 4000) | |
| `FRONTEND_URL` | URL du frontend pour CORS et liens email | ✅ |
| `SMTP_HOST` | Serveur SMTP | (emails ignorés si absent) |
| `SMTP_PORT` | Port SMTP (ex. 587) | |
| `SMTP_SECURE` | TLS : `true` pour 465, `false` pour 587 | |
| `SMTP_USER` | Adresse expéditeur | |
| `SMTP_PASS` | Mot de passe SMTP | |

## Migrations SQL

À appliquer manuellement si la base existe déjà (DigitalOcean console) :

```sql
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bl_counter INTEGER DEFAULT 0;
ALTER TABLE orders    ADD COLUMN IF NOT EXISTS bl_number VARCHAR(50);

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('Admin','Employé','SuperAdmin','Comptable','Commercial','Logistique','Livreur'));

ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_confirmed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_confirmed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS stock_movements (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id),
  delta      INTEGER NOT NULL,
  qty_before INTEGER NOT NULL,
  qty_after  INTEGER NOT NULL,
  reason     VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Architecture

```
skylight/
├── backend/          # Express + TypeScript (DigitalOcean App Platform)
│   └── src/
│       ├── middleware/   # auth, permissions, rateLimit, errorHandler, validate
│       ├── modules/      # auth, clients, commandes, factures, stock, dashboard
│       └── utils/        # pdf, bl-pdf, mailer
├── frontend/         # Next.js 14 App Router (Vercel)
└── database/
    └── schema.sql
```

## Rôles

| Rôle | Accès |
|---|---|
| Admin | Tout |
| Commercial | Clients + Commandes |
| Comptable | Factures |
| Logistique | Stock |
| Livreur | Passer commandes en "Livrée" uniquement |
