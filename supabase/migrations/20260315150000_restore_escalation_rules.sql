-- Migration: Restore Escalation Rules
-- Description: Recreates the escalation_rules table and the should_escalate_message function
-- Note: Uses proper word boundaries (\y) to prevent false positives like "hii".

BEGIN;

-- 1. Recreate escalation_rules table
CREATE TABLE IF NOT EXISTS public.escalation_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(workspace_id, keyword)
);

-- 2. Enable RLS
ALTER TABLE public.escalation_rules ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'escalation_rules' AND policyname = 'Allow select for workspace members'
    ) THEN
        CREATE POLICY "Allow select for workspace members" ON public.escalation_rules
            FOR SELECT TO authenticated USING (
                workspace_id IN (SELECT id FROM public.workspaces)
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'escalation_rules' AND policyname = 'Allow all for workspace members'
    ) THEN
        CREATE POLICY "Allow all for workspace members" ON public.escalation_rules
            FOR ALL TO authenticated USING (
                workspace_id IN (SELECT id FROM public.workspaces)
            );
    END IF;
END $$;

-- 4. Recreate should_escalate_message function
CREATE OR REPLACE FUNCTION should_escalate_message(
  p_workspace_id UUID,
  p_message_content TEXT
)
RETURNS TABLE(should_escalate BOOLEAN, reason TEXT, matched_keywords TEXT[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_escalation_keywords TEXT[];
  v_keyword TEXT;
  v_should_escalate BOOLEAN := FALSE;
  v_matched_keywords TEXT[] := '{}';
  v_message_lower TEXT;
  v_reason TEXT := '';
BEGIN
  v_message_lower := lower(p_message_content);

  -- Fetch active escalation keywords for this workspace
  SELECT array_agg(lower(keyword))
  INTO v_escalation_keywords
  FROM escalation_rules
  WHERE workspace_id = p_workspace_id
    AND is_active = true;

  IF v_escalation_keywords IS NULL THEN
    RETURN QUERY SELECT FALSE, ''::TEXT, '{}'::TEXT[];
    RETURN;
  END IF;

  -- Use POSIX word-boundary regex (\y) instead of LIKE
  -- This prevents "sue" matching "issue", or "hii" matching itself if we wanted, 
  -- but specifically fixes the "contained within" issues.
  FOREACH v_keyword IN ARRAY v_escalation_keywords
  LOOP
    IF v_message_lower ~* ('\y' || v_keyword || '\y') THEN
      v_should_escalate := TRUE;
      v_matched_keywords := array_append(v_matched_keywords, v_keyword);
    END IF;
  END LOOP;

  IF v_should_escalate THEN
    v_reason := 'Matched keywords: ' || array_to_string(v_matched_keywords, ', ');
  END IF;

  RETURN QUERY SELECT v_should_escalate, v_reason, v_matched_keywords;
END;
$$;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION should_escalate_message TO authenticated;
GRANT EXECUTE ON FUNCTION should_escalate_message TO service_role;

COMMIT;
