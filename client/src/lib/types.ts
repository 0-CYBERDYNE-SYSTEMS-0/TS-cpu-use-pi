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
  parameters: Record<string, {
    type: string;
    optional?: boolean;
    enum?: string[];
  }>;
  enabled: boolean;
  execute?: (args: Record<string, any>) => Promise<any>;
}

export interface SystemConfig {
  systemMessage: string;
  temperature: number;
  maxTokens: number;
}
