import { Tool } from '../../client/src/lib/types';
import { exec } from 'child_process';
import { promisify } from 'util';
import { claudeClient } from '../lib/claude';

const execAsync = promisify(exec);

const SAFE_COMMANDS = ['ps', 'ls', 'pwd', 'whoami', 'df', 'free', 'uptime', 'date', 'cal'];

import { registerTool } from './loader';

const computerControlTool: Tool = {
  name: 'computerControl',
  description: 'Execute computer commands with natural language interpretation',
  enabled: true,
  parameters: {
    command: {
      type: 'string',
      description: 'Natural language command to execute'
    }
  },
  async execute({ command }) {
    try {
      // Use Claude to interpret the natural language command
      const response = await claudeClient.sendMessage(
        `Convert this natural language command to a safe system command. Only return one of these commands: ${SAFE_COMMANDS.join(', ')}. Command: "${command}"`,
        {
          systemMessage: 'You are a computer command interpreter. Only respond with a single valid command from the allowed list, nothing else.',
          temperature: 0.1,
          maxTokens: 50
        }
      );

      const interpretedCommand = response.content.trim();
      
      // Validate interpreted command
      if (!SAFE_COMMANDS.includes(interpretedCommand)) {
        throw new Error('Invalid or unsafe command');
      }

      // Execute the command
      const { stdout } = await execAsync(interpretedCommand);
      return stdout;
    } catch (error) {
      throw new Error(`Command execution failed: ${error.message}`);
    }
  }
};

// Export the tool
export { computerControlTool };
