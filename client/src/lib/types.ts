export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
  status: 'pending' | 'success' | 'error';
  result?: any;
}

export interface ToolPermission {
  toolName: string;
  role: string;
  canExecute: boolean;
  canModify: boolean;
  canDelete: boolean;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, {
    type: string;
    optional?: boolean;
    enum?: string[];
  }>;
  enabled: boolean;
  permissions?: ToolPermission[];
  execute?: (args: Record<string, any>) => Promise<any>;
}

export interface SystemConfig {
  systemMessage: string;
  temperature: number;
  maxTokens: number;
}

export interface ToolStats {
  toolName: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgExecutionTimeMs: number;
  lastExecutedAt: string;
  enabled: boolean;
}

export interface ToolExecution {
  id: number;
  toolName: string;
  parameters: Record<string, any>;
  status: 'success' | 'error' | 'pending';
  result?: any;
  error?: string;
  executionTimeMs: number;
  createdAt: string;
}
