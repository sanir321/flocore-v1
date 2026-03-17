-- 1. Add slack to channel_type enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'channel_type' AND e.enumlabel = 'slack') THEN
    ALTER TYPE channel_type ADD VALUE 'slack';
  END IF;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

-- 2. Create slack_connections table
CREATE TABLE IF NOT EXISTS slack_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  slack_team_id TEXT NOT NULL,
  slack_team_name TEXT,
  bot_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,         -- Bot Token (xoxb-...)
  incoming_webhook_url TEXT,         -- Optional: for specific channel posting
  is_active BOOLEAN DEFAULT true,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, agent_id)
);

-- 3. RLS
ALTER TABLE slack_connections ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workspace members can manage slack connections') THEN
    CREATE POLICY "workspace members can manage slack connections"
      ON slack_connections
      FOR ALL
      USING (
        workspace_id IN (
          SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;
