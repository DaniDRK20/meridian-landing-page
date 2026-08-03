ALTER TABLE workspace_chat_channels ADD COLUMN IF NOT EXISTS kind VARCHAR(12) NOT NULL DEFAULT 'channel' CHECK (kind IN ('channel', 'direct'));
CREATE TABLE IF NOT EXISTS workspace_chat_channel_members (
  channel_id UUID NOT NULL REFERENCES workspace_chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  PRIMARY KEY (channel_id, user_id)
);
CREATE INDEX IF NOT EXISTS workspace_chat_channel_members_user_idx ON workspace_chat_channel_members(user_id);
