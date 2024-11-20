import { exec } from 'child_process';
import { promisify } from 'util';
import { Tool } from '../../client/src/lib/types';

const execAsync = promisify(exec);

import { registerTool } from './loader';

const systemControlTool: Tool = {
  name: 'systemControl',
  description: 'Execute system commands and get system information',
  enabled: true,
  parameters: {
    command: {
      type: 'string',
      enum: ['ps', 'df', 'free', 'uptime']
    }
  },
  async execute({ command }) {
    try {
      const { stdout } = await execAsync(command);
      return stdout;
    } catch (error) {
      throw new Error(`Command execution failed: ${error.message}`);
    }
  }
};

// Export the tool
export { systemControlTool };
