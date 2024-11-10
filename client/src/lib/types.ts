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

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  enabled: boolean;
}

export interface SystemConfig {
  systemMessage: string;
  temperature: number;
  maxTokens: number;
}
