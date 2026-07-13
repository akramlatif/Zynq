-- ============================================================
-- ZYNQ — Initial Database Schema
-- Migration: 0001_initial_schema
-- Generated for PostgreSQL 16
-- ============================================================

-- ─── ENUMS ──────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE plan_type AS ENUM ('free', 'starter', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'cashier');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('cash', 'udhaar', 'online', 'mixed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ─── SHOPS ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shops (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(200) NOT NULL,
  owner_name    VARCHAR(150) NOT NULL,
  phone         VARCHAR(20) NOT NULL UNIQUE,
  city          VARCHAR(100),
  plan_type     plan_type NOT NULL DEFAULT 'free',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─── USERS ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id       UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name          VARCHAR(150) NOT NULL,
  phone         VARCHAR(20) NOT NULL UNIQUE,
  role          user_role NOT NULL DEFAULT 'cashier',
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_shop_id ON users(shop_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);


-- ─── PRODUCTS ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name            VARCHAR(200) NOT NULL,
  category        VARCHAR(100) NOT NULL DEFAULT 'other',
  quantity        INTEGER NOT NULL DEFAULT 0,
  price           NUMERIC(12, 2) NOT NULL,
  cost_price      NUMERIC(12, 2),
  expiry_date     DATE,
  alert_threshold INTEGER NOT NULL DEFAULT 5,
  barcode         VARCHAR(100),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(shop_id, category);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(shop_id, name);


-- ─── BILLS ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bills (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  cashier_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  items           JSONB NOT NULL,
  total           NUMERIC(12, 2) NOT NULL,
  payment_method  payment_method NOT NULL DEFAULT 'cash',
  customer_name   VARCHAR(150),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bills_shop_id ON bills(shop_id);
CREATE INDEX IF NOT EXISTS idx_bills_cashier_id ON bills(cashier_id);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(shop_id, created_at);


-- ─── UDHAAR (CREDIT / KHATA) ───────────────────────────────

CREATE TABLE IF NOT EXISTS udhaar (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_name   VARCHAR(150) NOT NULL,
  customer_phone  VARCHAR(20),
  amount          NUMERIC(12, 2) NOT NULL,
  is_paid         BOOLEAN NOT NULL DEFAULT FALSE,
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_udhaar_shop_id ON udhaar(shop_id);
CREATE INDEX IF NOT EXISTS idx_udhaar_customer ON udhaar(shop_id, customer_name);
CREATE INDEX IF NOT EXISTS idx_udhaar_is_paid ON udhaar(shop_id, is_paid);


-- ─── SALES LOG (Analytics) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS sales_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity_sold   INTEGER NOT NULL,
  sale_price      NUMERIC(12, 2) NOT NULL,
  sold_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_log_shop_id ON sales_log(shop_id);
CREATE INDEX IF NOT EXISTS idx_sales_log_sold_at ON sales_log(sold_at);
CREATE INDEX IF NOT EXISTS idx_sales_log_product ON sales_log(shop_id, product_id);
CREATE INDEX IF NOT EXISTS idx_sales_log_analytics ON sales_log(shop_id, sold_at);


-- ─── TRIGGER: Auto-update updated_at on products ───────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
