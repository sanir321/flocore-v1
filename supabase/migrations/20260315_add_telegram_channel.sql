-- 1. Add telegram to channel_type enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'channel_type' AND e.enumlabel = 'telegram') THEN
    ALTER TYPE channel_type ADD VALUE 'telegram';
  END IF;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

-- 2. Create telegram_connections table
CREATE TABLE IF NOT EXISTS telegram_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  bot_token TEXT NOT NULL,
  bot_username TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, agent_id)
);

-- 3. RLS
ALTER TABLE telegram_connections ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workspace members can manage telegram connections') THEN
    CREATE POLICY "workspace members can manage telegram connections"
      ON telegram_connections
      FOR ALL
      USING (
        workspace_id IN (
          SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;
