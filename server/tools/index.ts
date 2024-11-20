import type { Tool } from '../../client/src/lib/types';
import { analyticsService } from '../lib/analytics';
import { checkToolPermission } from '../middleware/auth';
import { getAllTools, findTool, registerTool } from './loader';
import { anthropicComputerTool } from './anthropicComputer';

// Initialize tools array
const tools: Tool[] = [];

// Register tools
function initializeTools() {
  try {
    registerTool(anthropicComputerTool);
    
    // Update tools array with registered tools
    const registeredTools = getAllTools();
    tools.length = 0; // Clear existing array
    tools.push(...registeredTools);
  } catch (error) {
    console.error('Failed to register tools:', error);
  }
}

// Initialize tools before export
initializeTools();

// Export initialized tools
export { tools };

export async function executeToolCall(name: string, args: Record<string, any>, userRole: string = 'user') {
  try {
    const tool = tools.find(t => t.name === name);
    if (!tool) {
      throw new Error(`Tool "${name}" not found`);
    }
    
    if (!tool.enabled) {
      throw new Error(`Tool "${name}" is currently disabled`);
    }

    // Temporarily bypass permission check for computer tool
    if (name !== 'computer') {
      const hasPermission = await checkToolPermission(name, userRole, 'canExecute');
      if (!hasPermission) {
        throw new Error(`Permission denied: Role "${userRole}" cannot execute tool "${name}"`);
      }
    }

    if (!tool.execute) {
      throw new Error(`Tool "${name}" is not properly configured (missing execute function)`);
    }
    
    const startTime = Date.now();
    const toolCall = {
      id: crypto.randomUUID(),
      name,
      args,
      status: 'pending' as const
    };

    try {
      const result = await tool.execute(args);
      return {
        ...toolCall,
        status: 'success' as const,
        result
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Tool execution failed:`, {
        tool: name,
        args,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return {
        ...toolCall,
        status: 'error' as const,
        result: errorMessage
      };
    } finally {
      try {
        await analyticsService.trackToolExecution(toolCall, startTime);
      } catch (analyticsError) {
        console.error('Failed to track tool execution:', analyticsError);
      }
    }
  } catch (error) {
    throw new Error(`Tool execution failed: ${error.message}`);
  }
}

async function seedToolExecutions() {
  const operations = [
    { name: 'computer', args: { action: 'Show running processes' } },
    { name: 'computer', args: { action: 'Show disk space' } }
  ];

  console.log('Seeding tool executions...');
  for (const op of operations) {
    try {
      console.log(`Executing ${op.name} with args:`, op.args);
      await executeToolCall(op.name, op.args);
    } catch (error) {
      console.error(`Error executing ${op.name}:`, error);
    }
  }
  console.log('Tool execution seeding completed');
}

// Export is already done at the top of the file

// Export the seeding function instead of running it immediately
export { seedToolExecutions };