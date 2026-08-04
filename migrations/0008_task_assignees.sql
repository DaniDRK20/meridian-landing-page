CREATE TABLE IF NOT EXISTS workspace_task_assignees (
  task_id UUID NOT NULL REFERENCES workspace_tasks(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES workspace_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (task_id, member_id)
);

CREATE INDEX IF NOT EXISTS workspace_task_assignees_member_idx
  ON workspace_task_assignees(member_id);

INSERT INTO workspace_task_assignees (task_id, member_id)
SELECT id, assignee_id
FROM workspace_tasks
WHERE assignee_id IS NOT NULL
ON CONFLICT DO NOTHING;
