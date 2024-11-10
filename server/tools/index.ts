import { Tool } from '../../client/src/lib/types';
import { fileSystemTool } from './fileSystem';
import { systemControlTool } from './systemControl';

export const tools: Tool[] = [
  fileSystemTool,
  systemControlTool
];

export function executeToolCall(name: string, args: Record<string, any>) {
  const tool = tools.find(t => t.name === name);
  if (!tool || !tool.enabled) {
    throw new Error('Tool not found or disabled');
  }

  return tool.execute(args);
}
