import { Tool, ToolCall } from './types';
import { wsClient } from './websocket';

// In-memory cache of registered tools
let tools: Tool[] = [];

// Tool execution status event handlers
const toolStatusHandlers = new Set<(toolCall: ToolCall) => void>();

// Initialize tool handling
wsClient.onToolCall((toolCall) => {
  notifyToolStatusHandlers(toolCall);
});

/**
 * Register a new tool with the system
 */
export function registerTool(tool: Tool) {
  if (tools.find(t => t.name === tool.name)) {
    throw new Error(`Tool "${tool.name}" is already registered`);
  }
  tools.push(tool);
}

/**
 * Update the enabled status of a tool
 */
export function updateToolStatus(name: string, enabled: boolean) {
  const tool = tools.find(t => t.name === name);
  if (!tool) {
    throw new Error(`Tool "${name}" not found`);
  }
  tool.enabled = enabled;
}

/**
 * Get all registered tools
 */
export function getTools(): Tool[] {
  return [...tools];
}

/**
 * Get a specific tool by name
 */
export function getTool(name: string): Tool | undefined {
  return tools.find(t => t.name === name);
}

/**
 * Subscribe to tool execution status updates
 */
export function onToolStatus(handler: (toolCall: ToolCall) => void) {
  toolStatusHandlers.add(handler);
  return () => {
    toolStatusHandlers.delete(handler);
  };
}

/**
 * Notify all subscribers of a tool status update
 */
function notifyToolStatusHandlers(toolCall: ToolCall) {
  toolStatusHandlers.forEach(handler => handler(toolCall));
}

/**
 * Validate tool parameters against schema
 */
export function validateToolParameters(
  tool: Tool,
  parameters: Record<string, any>
): boolean {
  for (const [key, schema] of Object.entries(tool.parameters)) {
    // Skip optional parameters that aren't provided
    if (schema.optional && !(key in parameters)) {
      continue;
    }

    // Required parameter is missing
    if (!schema.optional && !(key in parameters)) {
      return false;
    }

    // Type validation
    const value = parameters[key];
    if (schema.type === 'string' && typeof value !== 'string') {
      return false;
    }
    if (schema.type === 'number' && typeof value !== 'number') {
      return false;
    }
    if (schema.type === 'boolean' && typeof value !== 'boolean') {
      return false;
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(value)) {
      return false;
    }
  }

  return true;
}

/**
 * Format tool parameters for display
 */
export function formatToolParameters(tool: Tool): string {
  const params = Object.entries(tool.parameters).map(([key, schema]) => {
    const required = schema.optional ? '' : ' (required)';
    const type = schema.type;
    const enumValues = schema.enum ? ` [${schema.enum.join('|')}]` : '';
    return `${key}: ${type}${enumValues}${required}`;
  });
  return params.join('\n');
}

/**
 * Clear all registered tools
 */
export function clearTools() {
  tools = [];
}

// Register built-in tools
registerTool({
  name: 'fileSystem',
  description: 'Perform file system operations',
  enabled: true,
  parameters: {
    operation: {
      type: 'string',
      enum: ['read', 'write', 'list', 'delete']
    },
    path: {
      type: 'string'
    },
    content: {
      type: 'string',
      optional: true
    }
  }
});

registerTool({
  name: 'systemControl',
  description: 'Execute system commands and get system information',
  enabled: true,
  parameters: {
    command: {
      type: 'string',
      enum: ['ps', 'df', 'free', 'uptime']
    }
  }
});
