CREATE TABLE IF NOT EXISTS tool_permissions (
  id SERIAL PRIMARY KEY,
  tool_name TEXT NOT NULL,
  role TEXT NOT NULL,
  can_execute BOOLEAN DEFAULT false NOT NULL,
  can_modify BOOLEAN DEFAULT false NOT NULL,
  can_delete BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraint to prevent duplicate permissions
CREATE UNIQUE INDEX IF NOT EXISTS tool_permissions_unique_idx ON tool_permissions (tool_name, role);

-- Add default permissions for existing tools
INSERT INTO tool_permissions (tool_name, role, can_execute, can_modify, can_delete)
SELECT 
  name as tool_name,
  'admin' as role,
  true as can_execute,
  true as can_modify,
  true as can_delete
FROM (
  SELECT 'fileSystem' as name
  UNION ALL
  SELECT 'systemControl'
) as tools
ON CONFLICT DO NOTHING;

INSERT INTO tool_permissions (tool_name, role, can_execute, can_modify, can_delete)
SELECT 
  name as tool_name,
  'user' as role,
  true as can_execute,
  false as can_modify,
  false as can_delete
FROM (
  SELECT 'fileSystem' as name
  UNION ALL
  SELECT 'systemControl'
) as tools
ON CONFLICT DO NOTHING;
