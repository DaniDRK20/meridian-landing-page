CREATE TABLE IF NOT EXISTS workspace_chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(80) NOT NULL,
  slug VARCHAR(90) UNIQUE NOT NULL, description VARCHAR(220) NOT NULL DEFAULT '',
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS workspace_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES workspace_chat_channels(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  reply_to_id UUID REFERENCES workspace_chat_messages(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 4000),
  edited_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS workspace_chat_mentions (
  message_id UUID NOT NULL REFERENCES workspace_chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  PRIMARY KEY (message_id, user_id)
);
CREATE TABLE IF NOT EXISTS workspace_chat_reads (
  channel_id UUID NOT NULL REFERENCES workspace_chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (channel_id, user_id)
);
CREATE INDEX IF NOT EXISTS workspace_chat_messages_channel_created_idx ON workspace_chat_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS workspace_chat_mentions_user_idx ON workspace_chat_mentions(user_id);
INSERT INTO workspace_chat_channels (name,slug,description) VALUES ('General','general','Conversaciones de todo el equipo') ON CONFLICT (slug) DO NOTHING;
