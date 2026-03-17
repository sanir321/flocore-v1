-- Fix escalation false positives by replacing LIKE with word-boundary regex
-- \y in Postgres POSIX regex matches word boundaries
-- This prevents "issue" from matching "sue", "assess" from matching "ass", etc.

-- Drop existing function to cleanly allow changing the return type from JSONB to TABLE
DROP FUNCTION IF EXISTS should_escalate_message(UUID, TEXT);

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

  -- Use POSIX word-boundary regex instead of LIKE
  -- \y matches word boundaries so "sue" won't match inside "issue"
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
