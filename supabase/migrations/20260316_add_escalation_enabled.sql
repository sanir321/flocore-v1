-- Add escalation_enabled field to workspaces table
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS escalation_enabled BOOLEAN DEFAULT true;

-- Update existing workspaces to have escalation enabled by default
UPDATE workspaces 
SET escalation_enabled = true 
WHERE escalation_enabled IS NULL;
