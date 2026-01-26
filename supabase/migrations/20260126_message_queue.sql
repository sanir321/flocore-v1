-- ============================================================
-- FLOWCORE FIX: Phase 1 - Reliable Message Queue System
-- ============================================================
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. MESSAGE PROCESSING QUEUE TABLE
-- Stores all customer messages pending AI processing
CREATE TABLE IF NOT EXISTS message_processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'abandoned')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    next_retry_at TIMESTAMPTZ DEFAULT NOW(),
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Index for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_queue_pending ON message_processing_queue(status, next_retry_at) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_queue_message ON message_processing_queue(message_id);

-- 2. AUTOMATIC ENQUEUE TRIGGER
-- Automatically adds customer messages to the queue
CREATE OR REPLACE FUNCTION enqueue_customer_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_workspace_id UUID;
    v_assigned_to_human BOOLEAN;
BEGIN
    -- Only enqueue customer messages
    IF NEW.sender != 'customer' THEN
        RETURN NEW;
    END IF;
    
    -- Fetch conversation details
    SELECT c.workspace_id, c.assigned_to_human
    INTO v_workspace_id, v_assigned_to_human
    FROM conversations c
    WHERE c.id = NEW.conversation_id;
    
    -- Only enqueue if AI is active (not assigned to human)
    IF v_assigned_to_human = FALSE OR v_assigned_to_human IS NULL THEN
        INSERT INTO message_processing_queue (
            message_id,
            conversation_id,
            workspace_id,
            status,
            next_retry_at
        ) VALUES (
            NEW.id,
            NEW.conversation_id,
            v_workspace_id,
            'pending',
            NOW()
        )
        ON CONFLICT (message_id) DO NOTHING; -- Idempotency
    END IF;
    
    RETURN NEW;
END;
$$;

-- Add unique constraint for idempotency
ALTER TABLE message_processing_queue 
ADD CONSTRAINT unique_message_queue UNIQUE (message_id);

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS trigger_enqueue_message ON messages;
CREATE TRIGGER trigger_enqueue_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION enqueue_customer_message();

-- 3. QUEUE PROCESSING FUNCTIONS

-- Function to claim a batch of queue items for processing
CREATE OR REPLACE FUNCTION claim_queue_items(p_batch_size INTEGER DEFAULT 5)
RETURNS SETOF message_processing_queue
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    UPDATE message_processing_queue
    SET 
        status = 'processing',
        attempts = attempts + 1
    WHERE id IN (
        SELECT q.id
        FROM message_processing_queue q
        WHERE q.status = 'pending'
          AND q.next_retry_at <= NOW()
          AND q.attempts < q.max_attempts
        ORDER BY q.next_retry_at ASC
        LIMIT p_batch_size
        FOR UPDATE SKIP LOCKED
    )
    RETURNING *;
END;
$$;

-- Function to mark item as completed
CREATE OR REPLACE FUNCTION complete_queue_item(p_queue_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE message_processing_queue
    SET 
        status = 'completed',
        processed_at = NOW()
    WHERE id = p_queue_id;
END;
$$;

-- Function to mark item as failed (will retry)
CREATE OR REPLACE FUNCTION fail_queue_item(p_queue_id UUID, p_error TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_attempts INTEGER;
    v_max_attempts INTEGER;
BEGIN
    SELECT attempts, max_attempts INTO v_attempts, v_max_attempts
    FROM message_processing_queue WHERE id = p_queue_id;
    
    IF v_attempts >= v_max_attempts THEN
        -- Max retries reached, abandon
        UPDATE message_processing_queue
        SET 
            status = 'abandoned',
            last_error = p_error,
            processed_at = NOW()
        WHERE id = p_queue_id;
    ELSE
        -- Schedule retry with exponential backoff (30s, 60s, 120s)
        UPDATE message_processing_queue
        SET 
            status = 'pending',
            last_error = p_error,
            next_retry_at = NOW() + (POWER(2, v_attempts) * INTERVAL '30 seconds')
        WHERE id = p_queue_id;
    END IF;
END;
$$;

-- 4. MONITORING VIEW
CREATE OR REPLACE VIEW queue_health AS
SELECT 
    status,
    COUNT(*) as count,
    AVG(attempts) as avg_attempts,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM message_processing_queue
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_status 
ON conversations(status, assigned_to_human);

CREATE INDEX IF NOT EXISTS idx_conversations_workspace_status
ON conversations(workspace_id, status);

-- 6. GRANT PERMISSIONS
GRANT SELECT, INSERT, UPDATE ON message_processing_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE ON message_processing_queue TO service_role;
GRANT EXECUTE ON FUNCTION claim_queue_items TO service_role;
GRANT EXECUTE ON FUNCTION complete_queue_item TO service_role;
GRANT EXECUTE ON FUNCTION fail_queue_item TO service_role;

-- 7. ENABLE REALTIME (optional, for monitoring)
ALTER PUBLICATION supabase_realtime ADD TABLE message_processing_queue;

-- ============================================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================================
-- Check trigger exists:
-- SELECT * FROM pg_trigger WHERE tgname = 'trigger_enqueue_message';

-- Check queue health:
-- SELECT * FROM queue_health;

-- Check function exists:
-- SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%queue%';
