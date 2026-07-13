-- ============================================================
-- ZYNQ — Smart Alerts Tables
-- Migration: 0004_add_alerts_tables
-- ============================================================

DO $$ BEGIN
  CREATE TYPE alert_type AS ENUM ('daily_stock', 'weekly_summary', 'slow_movers', 'manual_test');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── ALERTS LOG ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alerts_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  type            alert_type NOT NULL,
  message         TEXT NOT NULL,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          VARCHAR(50) NOT NULL -- 'sent', 'failed'
);

CREATE INDEX IF NOT EXISTS idx_alerts_log_shop_id ON alerts_log(shop_id);
CREATE INDEX IF NOT EXISTS idx_alerts_log_sent_at ON alerts_log(shop_id, sent_at);

-- ─── SLOW MOVERS ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS slow_movers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  flagged_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sale_date  TIMESTAMPTZ,
  qty_remaining   INTEGER NOT NULL,
  UNIQUE(shop_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_slow_movers_shop_id ON slow_movers(shop_id);
