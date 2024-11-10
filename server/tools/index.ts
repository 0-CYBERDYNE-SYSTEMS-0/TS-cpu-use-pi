import { Tool } from '../../client/src/lib/types';
import { fileSystemTool } from './fileSystem';
import { systemControlTool } from './systemControl';
import { analyticsService } from '../lib/analytics';

export const tools: Tool[] = [
  fileSystemTool,
  systemControlTool
];

export async function executeToolCall(name: string, args: Record<string, any>) {
  const tool = tools.find(t => t.name === name);
  if (!tool || !tool.enabled) {
    throw new Error('Tool not found or disabled');
  }

  const startTime = Date.now();
  try {
    const result = await tool.execute(args);
    const toolCall = {
      id: crypto.randomUUID(),
      name,
      args,
      status: 'success' as const,
      result
    };
    await analyticsService.trackToolExecution(toolCall, startTime);
    return result;
  } catch (error) {
    const toolCall = {
      id: crypto.randomUUID(),
      name,
      args,
      status: 'error' as const,
      result: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    await analyticsService.trackToolExecution(toolCall, startTime);
    throw error;
  }
}
