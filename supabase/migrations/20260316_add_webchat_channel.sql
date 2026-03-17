-- 1. Add webchat to channel_type enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'channel_type' AND e.enumlabel = 'webchat') THEN
    ALTER TYPE channel_type ADD VALUE 'webchat';
  END IF;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

-- 2. Create webchat_settings table
CREATE TABLE IF NOT EXISTS webchat_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  widget_title TEXT DEFAULT 'Chat with AI',
  primary_color TEXT DEFAULT '#3b82f6',
  welcome_message TEXT DEFAULT 'Hi there! How can I help you today?',
  is_active BOOLEAN DEFAULT true,
  domain_whitelist TEXT[], -- For CORS protection
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, agent_id)
);

-- 3. RLS
ALTER TABLE webchat_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workspace members can manage webchat settings') THEN
    CREATE POLICY "workspace members can manage webchat settings"
      ON webchat_settings
      FOR ALL
      USING (
        workspace_id IN (
          SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 4. Public access for widget to READ settings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public can read webchat settings') THEN
    CREATE POLICY "public can read webchat settings"
      ON webchat_settings
      FOR SELECT
      TO public
      USING (is_active = true);
  END IF;
END $$;
