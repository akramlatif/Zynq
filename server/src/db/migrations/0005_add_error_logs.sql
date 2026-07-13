-- ============================================================
-- ZYNQ — Error Logs Table
-- Migration: 0005_add_error_logs
-- ============================================================

CREATE TABLE IF NOT EXISTS error_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         UUID REFERENCES shops(id) ON DELETE SET NULL,
  endpoint        VARCHAR(255) NOT NULL,
  status_code     INTEGER NOT NULL,
  error_message   TEXT NOT NULL,
  ip_address      VARCHAR(45),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_shop ON error_logs(shop_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
