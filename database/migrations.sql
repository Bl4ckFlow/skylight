-- ============================================
-- SKYLIGHT — Incremental migrations
-- Run these against the live DB in order.
-- schema.sql is the canonical reference for fresh installs.
-- ============================================

-- [2025-xx] Add token_version to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;

-- [2025-xx] Compound indexes for query performance
CREATE INDEX IF NOT EXISTS idx_orders_company_status    ON orders(company_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_company_createdat ON orders(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_company_payment_status ON invoices(company_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC);
