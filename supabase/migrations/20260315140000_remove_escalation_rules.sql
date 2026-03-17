-- Migration: Remove Escalation Rules
-- Description: Drops the escalation_rules table and the should_escalate_message function 
-- to resolve false positive escalations and move towards AI-only intent detection.

BEGIN;

-- Drop the function first (handles dependencies)
DROP FUNCTION IF EXISTS public.should_escalate_message(uuid, text);

-- Drop the table
DROP TABLE IF EXISTS public.escalation_rules;

COMMIT;
