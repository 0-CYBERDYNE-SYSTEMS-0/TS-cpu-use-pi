import type { Tool } from '../../client/src/lib/types';
import { anthropicComputerTool } from './anthropicComputer';

// Initialize tools array
const tools: Tool[] = [];
const registeredTools: Map<string, Tool> = new Map();

// Register a new tool
export function registerTool(tool: Tool) {
  if (registeredTools.has(tool.name)) {
    throw new Error(`Tool "${tool.name}" is already registered`);
  }
  registeredTools.set(tool.name, tool);
  tools.push(tool);
}

// Get all registered tools
export function getAllTools(): Tool[] {
  return [...tools];
}

// Find tool by name
export function findTool(name: string): Tool | undefined {
  return registeredTools.get(name);
}

// Export for type checking
export type { Tool };

// Initialize with only the Anthropic computer tool
export function initializeTools() {
  try {
    registerTool(anthropicComputerTool);
  } catch (error) {
    console.error('Failed to register Anthropic computer tool:', error);
  }
}
