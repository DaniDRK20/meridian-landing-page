CREATE TABLE IF NOT EXISTS workspace_google_calendar_connections (
  user_id uuid PRIMARY KEY REFERENCES admin_users(id) ON DELETE CASCADE,
  google_email text,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS workspace_google_event_links (
  user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  workspace_event_id uuid NOT NULL REFERENCES workspace_events(id) ON DELETE CASCADE,
  google_event_id text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,workspace_event_id)
);
