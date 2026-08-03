ALTER TABLE workspace_presence ADD COLUMN IF NOT EXISTS typing_channel UUID REFERENCES workspace_chat_channels(id) ON DELETE SET NULL;
ALTER TABLE workspace_presence ADD COLUMN IF NOT EXISTS typing_at TIMESTAMPTZ;
