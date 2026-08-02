UPDATE workspace_tasks
SET code = 'RES-' || substring(code FROM '[0-9]+$')
WHERE code LIKE 'MW-%';
