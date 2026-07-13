-- ============================================================
-- ZYNQ — Error Logs Metadata Extension
-- Migration: 0006_add_json_metadata_to_logs
-- ============================================================

ALTER TABLE error_logs ADD COLUMN IF NOT EXISTS metadata JSONB;
