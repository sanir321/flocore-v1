-- ============================================================
-- FLOWCORE: Add phone_number_id to whatsapp_connections + rate_limits table
-- ============================================================

-- 1. Add phone_number_id column to whatsapp_connections
-- This maps the Meta WhatsApp phone_number_id to a workspace
ALTER TABLE whatsapp_connections
ADD COLUMN IF NOT EXISTS phone_number_id TEXT;

CREATE INDEX IF NOT EXISTS idx_wa_conn_phone_number_id
ON whatsapp_connections(phone_number_id);

-- 2. Rate limiting table for webhook
CREATE TABLE IF NOT EXISTS rate_limits (
    identifier TEXT PRIMARY KEY,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grant access
GRANT SELECT, INSERT, UPDATE ON rate_limits TO service_role;
