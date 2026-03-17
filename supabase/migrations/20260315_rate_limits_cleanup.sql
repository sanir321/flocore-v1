-- ============================================================
-- FLOWCORE: Add rate limits cleanup function
-- ============================================================

-- 1. Create a function to clean old rate limit entries
-- Entries older than 1 hour are considered expired and can be cleaned up
CREATE OR REPLACE FUNCTION clean_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM rate_limits
    WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$;

-- 2. Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION clean_expired_rate_limits TO service_role;

-- 3. Create a cron job to run cleanup every 15 minutes
-- This uses pg_cron extension (must be enabled in Supabase)
SELECT cron.schedule(
    'cleanup-rate-limits',
    '*/15 * * * *',
    'SELECT clean_expired_rate_limits()'
);

-- 4. Alternative: Manual cleanup can be triggered via:
-- SELECT clean_expired_rate_limits();
