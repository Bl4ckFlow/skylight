-- ============================================
-- SKYLIGHT — PostgreSQL Schema (canonical)
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. COMPANIES (Tenants)
-- ============================================
CREATE TABLE companies (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name              VARCHAR(255) NOT NULL,
    subscription_plan VARCHAR(50) NOT NULL DEFAULT 'free'
                      CHECK (subscription_plan IN ('free', 'starter', 'pro')),
    -- company identity / settings
    activity          VARCHAR(255),
    address           TEXT,
    phone             VARCHAR(50),
    fax               VARCHAR(50),
    email             VARCHAR(255),
    website           VARCHAR(255),
    capital_social    VARCHAR(100),
    -- fiscal identifiers
    nif               VARCHAR(50),
    nis               VARCHAR(50),
    tin               VARCHAR(50),
    rc                VARCHAR(50),
    tva_rate          NUMERIC(5,2) NOT NULL DEFAULT 19,
    -- banking
    bank_name         VARCHAR(255),
    bank_rib          VARCHAR(100),
    bank_name2        VARCHAR(255),
    bank_rib2         VARCHAR(100),
    -- BL counter
    bl_counter        INTEGER NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. USERS
-- ============================================
CREATE TABLE users (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id           UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email                VARCHAR(255) NOT NULL UNIQUE,
    password_hash        VARCHAR(255) NOT NULL,
    role                 VARCHAR(20) NOT NULL DEFAULT 'Employé'
                         CHECK (role IN ('Admin','Employé','SuperAdmin','Comptable','Commercial','Logistique','Livreur')),
    must_change_password BOOLEAN NOT NULL DEFAULT true,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_company_id ON users(company_id);

-- ============================================
-- 3. CLIENTS
-- ============================================
CREATE TABLE clients (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    full_name   VARCHAR(255) NOT NULL,
    phone       VARCHAR(30),
    email       VARCHAR(255),
    address     TEXT,
    client_type VARCHAR(20) NOT NULL DEFAULT 'Particulier'
                CHECK (client_type IN ('Particulier', 'Entreprise')),
    -- fiscal fields (Entreprise only)
    nif         VARCHAR(50),
    nis         VARCHAR(50),
    rc          VARCHAR(50),
    ai          VARCHAR(50),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_company_id ON clients(company_id);

-- ============================================
-- 4. PRODUCTS
-- ============================================
CREATE TABLE products (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    stock_quantity      INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    buy_price           NUMERIC(12, 2) NOT NULL DEFAULT 0,
    sell_price          NUMERIC(12, 2) NOT NULL DEFAULT 0,
    category            VARCHAR(100),
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_company_id ON products(company_id);

-- ============================================
-- 5. ORDERS
-- ============================================
CREATE TABLE orders (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id           UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_id            UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    status               VARCHAR(20) NOT NULL DEFAULT 'En attente'
                         CHECK (status IN ('En attente', 'En cours', 'Livrée')),
    total_amount         NUMERIC(12, 2) NOT NULL DEFAULT 0,
    notes                TEXT,
    bl_number            VARCHAR(50),
    client_confirmed     BOOLEAN NOT NULL DEFAULT false,
    client_confirmed_at  TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_company_id ON orders(company_id);
CREATE INDEX idx_orders_client_id  ON orders(client_id);
CREATE INDEX idx_orders_status     ON orders(status);

-- ============================================
-- 6. ORDER ITEMS
-- ============================================
CREATE TABLE order_items (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity   INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL
);

CREATE INDEX idx_order_items_order_id   ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- ============================================
-- 7. ORDER LOGS
-- ============================================
CREATE TABLE order_logs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status         VARCHAR(20),
    to_status           VARCHAR(20) NOT NULL,
    changed_by_user_id  UUID REFERENCES users(id),
    changed_by_email    VARCHAR(255),
    changed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_logs_order_id ON order_logs(order_id);

-- ============================================
-- 8. INVOICES
-- ============================================
CREATE TABLE invoices (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    order_id       UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'Non Payé'
                   CHECK (payment_status IN ('Payé', 'Non Payé')),
    pdf_url        VARCHAR(500),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_company_id     ON invoices(company_id);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);

-- ============================================
-- 9. INVOICE LOGS
-- ============================================
CREATE TABLE invoice_logs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id          UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    from_status         VARCHAR(20),
    to_status           VARCHAR(20) NOT NULL,
    changed_by_user_id  UUID REFERENCES users(id),
    changed_by_email    VARCHAR(255),
    changed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 10. STOCK MOVEMENTS
-- ============================================
CREATE TABLE stock_movements (
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

CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_company_id ON stock_movements(company_id);

-- ============================================
-- NOTE: Stock is managed in the application layer (commandes.service.ts)
-- with explicit stock checks inside a transaction. No DB trigger needed.
-- ============================================
