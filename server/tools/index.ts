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
    throw new Error(`Tool "${name}" not found or disabled`);
  }

  const startTime = Date.now();
  let toolCall;

  try {
    const result = await tool.execute(args);
    toolCall = {
      id: crypto.randomUUID(),
      name,
      args,
      status: 'success' as const,
      result
    };
    return result;
  } catch (error) {
    toolCall = {
      id: crypto.randomUUID(),
      name,
      args,
      status: 'error' as const,
      result: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    throw error;
  } finally {
    if (toolCall) {
      try {
        await analyticsService.trackToolExecution(toolCall, startTime);
      } catch (analyticsError) {
        console.error('Failed to track tool execution:', analyticsError);
        // Don't throw here to avoid affecting the main execution flow
      }
    }
  }
}
