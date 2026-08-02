CREATE TABLE IF NOT EXISTS workspace_presence (
  user_id UUID PRIMARY KEY REFERENCES admin_users(id) ON DELETE CASCADE,
  state VARCHAR(12) NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'away')),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS workspace_presence_last_seen_idx ON workspace_presence(last_seen_at DESC);
