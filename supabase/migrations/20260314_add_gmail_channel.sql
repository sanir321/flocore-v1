-- 1. Add gmail to channel_type enum if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'channel_type' AND e.enumlabel = 'gmail') THEN
    ALTER TYPE channel_type ADD VALUE 'gmail';
  END IF;
EXCEPTION WHEN undefined_object THEN
  -- If enum doesn't exist at all, we'll just handle it being a text column later if needed, 
  -- but usually FlowCore uses text or enum. Let's assume text for now as per step 4/5.
  NULL;
END $$;

-- 2. Create gmail_connections table
-- Stores one Gmail connection per agent per workspace
CREATE TABLE IF NOT EXISTS gmail_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  gmail_address TEXT NOT NULL,           -- user's Gmail address
  access_token TEXT NOT NULL,            -- short-lived, expires in 1hr
  refresh_token TEXT NOT NULL,           -- long-lived, used to refresh
  token_expiry TIMESTAMPTZ NOT NULL,     -- when access_token expires
  history_id TEXT,                       -- Gmail historyId for polling (tracks last synced position)
  last_polled_at TIMESTAMPTZ,            -- when we last checked for new emails
  is_active BOOLEAN DEFAULT true,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, agent_id)           -- one Gmail per agent
);

-- 3. RLS
ALTER TABLE gmail_connections ENABLE ROW LEVEL SECURITY;

-- Dynamic RLS based on workspace membership
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workspace members can manage gmail connections') THEN
    CREATE POLICY "workspace members can manage gmail connections"
      ON gmail_connections
      FOR ALL
      USING (
        workspace_id IN (
          SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 4. Add channel column to conversations if not already added
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS channel_metadata JSONB DEFAULT '{}';

-- 5. Add channel column to messages if not already added
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'whatsapp';

-- 6. Indexes for polling
CREATE INDEX IF NOT EXISTS idx_gmail_conn_active ON gmail_connections(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_gmail_conn_agent ON gmail_connections(agent_id);
