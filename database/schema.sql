-- ============================================
-- SKYLIGHT MVP — PostgreSQL Schema
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
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. USERS
-- ============================================
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL DEFAULT 'Employé'
                  CHECK (role IN ('Admin', 'Employé')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_company_id ON users(company_id);

-- ============================================
-- 3. CLIENTS
-- ============================================
CREATE TABLE clients (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    full_name  VARCHAR(255) NOT NULL,
    phone      VARCHAR(30),
    email      VARCHAR(255),
    address    TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_id    UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    status       VARCHAR(20) NOT NULL DEFAULT 'En attente'
                 CHECK (status IN ('En attente', 'En cours', 'Livrée')),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
-- 7. INVOICES
-- ============================================
CREATE TABLE invoices (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    order_id       UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'Non Payé'
                   CHECK (payment_status IN ('Payé', 'Non Payé')),
    pdf_url        VARCHAR(500),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_company_id     ON invoices(company_id);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);

-- ============================================
-- TRIGGER : Décrémentation du stock à la commande
-- ============================================
CREATE OR REPLACE FUNCTION update_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_stock
AFTER INSERT ON order_items
FOR EACH ROW EXECUTE FUNCTION update_stock_on_order();
