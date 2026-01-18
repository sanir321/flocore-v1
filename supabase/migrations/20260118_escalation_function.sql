-- SQL Migration: Create escalation detection function
-- Run this in Supabase SQL Editor

-- Function to check if a message should trigger escalation
CREATE OR REPLACE FUNCTION should_escalate_message(
  p_workspace_id UUID,
  p_message_content TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_should_escalate BOOLEAN := FALSE;
  v_reason TEXT := NULL;
  v_matched_keywords TEXT[] := '{}';
  v_message_lower TEXT;
  v_escalation_keywords TEXT[] := ARRAY[
    'speak to human',
    'talk to human',
    'real person',
    'human agent',
    'speak to someone',
    'talk to someone',
    'manager',
    'supervisor',
    'complaint',
    'legal',
    'lawyer',
    'sue',
    'lawsuit',
    'refund',
    'angry',
    'furious',
    'terrible',
    'worst',
    'horrible',
    'disgusting',
    'unacceptable',
    'fraud',
    'scam',
    'report',
    'emergency',
    'urgent',
    'help me now',
    'cancel everything',
    'never again'
  ];
  v_keyword TEXT;
BEGIN
  -- Normalize message
  v_message_lower := LOWER(p_message_content);
  
  -- Check for escalation keywords
  FOREACH v_keyword IN ARRAY v_escalation_keywords
  LOOP
    IF v_message_lower LIKE '%' || v_keyword || '%' THEN
      v_should_escalate := TRUE;
      v_matched_keywords := array_append(v_matched_keywords, v_keyword);
    END IF;
  END LOOP;
  
  -- Determine reason
  IF v_should_escalate THEN
    IF v_matched_keywords && ARRAY['angry', 'furious', 'terrible', 'worst', 'horrible', 'disgusting', 'unacceptable'] THEN
      v_reason := 'angry_language';
    ELSIF v_matched_keywords && ARRAY['speak to human', 'talk to human', 'real person', 'human agent'] THEN
      v_reason := 'human_requested';
    ELSIF v_matched_keywords && ARRAY['legal', 'lawyer', 'sue', 'lawsuit', 'fraud', 'scam'] THEN
      v_reason := 'legal_threat';
    ELSIF v_matched_keywords && ARRAY['emergency', 'urgent', 'help me now'] THEN
      v_reason := 'urgent_request';
    ELSE
      v_reason := 'keyword_match';
    END IF;
  END IF;
  
  -- Build result
  v_result := jsonb_build_object(
    'should_escalate', v_should_escalate,
    'reason', v_reason,
    'matched_keywords', to_jsonb(v_matched_keywords)
  );
  
  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION should_escalate_message TO authenticated;
GRANT EXECUTE ON FUNCTION should_escalate_message TO service_role;

-- Create ai_interactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  model TEXT,
  tool_calls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add escalation columns to conversations if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conversations' AND column_name = 'escalation_reason') THEN
    ALTER TABLE conversations ADD COLUMN escalation_reason TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conversations' AND column_name = 'escalated_at') THEN
    ALTER TABLE conversations ADD COLUMN escalated_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add channel column if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conversations' AND column_name = 'channel') THEN
    ALTER TABLE conversations ADD COLUMN channel TEXT DEFAULT 'whatsapp';
  END IF;
END $$;

-- Add provider_message_id to messages for idempotency
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'provider_message_id') THEN
    ALTER TABLE messages ADD COLUMN provider_message_id TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS messages_provider_id_idx 
      ON messages(conversation_id, provider_message_id) 
      WHERE provider_message_id IS NOT NULL;
  END IF;
END $$;

-- Enable Realtime for messages and conversations
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

COMMENT ON FUNCTION should_escalate_message IS 'Checks if a customer message contains keywords that should trigger escalation to human operator';
