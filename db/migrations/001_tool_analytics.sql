CREATE TABLE IF NOT EXISTS tool_executions (
  id SERIAL PRIMARY KEY,
  tool_name TEXT NOT NULL,
  parameters JSONB NOT NULL,
  status TEXT NOT NULL,
  result JSONB,
  error TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tool_stats (
  tool_name TEXT PRIMARY KEY,
  total_executions INTEGER DEFAULT 0 NOT NULL,
  successful_executions INTEGER DEFAULT 0 NOT NULL,
  failed_executions INTEGER DEFAULT 0 NOT NULL,
  avg_execution_time_ms INTEGER,
  last_executed_at TIMESTAMP,
  enabled BOOLEAN DEFAULT true NOT NULL
);
