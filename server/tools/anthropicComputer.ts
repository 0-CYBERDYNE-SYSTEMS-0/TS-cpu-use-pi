import { Tool } from '../../client/src/lib/types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const computerTools = {
  async browse({ url }: { url: string }) {
    try {
      await execAsync(`DISPLAY=:0 firefox "${url}"`);
      return { type: 'browse', status: 'success', url };
    } catch (error) {
      throw new Error(`Failed to browse URL: ${error.message}`);
    }
  },
  
  async execute({ command }: { command: string }) {
    try {
      const { stdout } = await execAsync(command);
      return { type: 'execute', status: 'success', output: stdout };
    } catch (error) {
      throw new Error(`Failed to execute command: ${error.message}`);
    }
  },
  
  async click({ x, y }: { x: number, y: number }) {
    try {
      await execAsync(`DISPLAY=:0 xdotool mousemove ${x} ${y} click 1`);
      return { type: 'click', status: 'success', coordinates: { x, y } };
    } catch (error) {
      throw new Error(`Failed to click: ${error.message}`);
    }
  },
  
  async type({ text }: { text: string }) {
    try {
      await execAsync(`DISPLAY=:0 xdotool type "${text}"`);
      return { type: 'type', status: 'success', text };
    } catch (error) {
      throw new Error(`Failed to type text: ${error.message}`);
    }
  }
};

const anthropicComputerTool: Tool = {
  name: 'computer',
  description: 'Interact with the computer using mouse, keyboard, and browser',
  enabled: true,
  parameters: {
    action: {
      type: 'string',
      description: 'The action to perform'
    }
  },
  async execute(args) {
    const { action, ...params } = args;
    
    // Determine the tool method based on the action
    const toolMethod = Object.keys(computerTools).find(method => 
      action.toLowerCase().includes(method)
    ) || 'browse';

    try {
      const result = await computerTools[toolMethod]({ 
        ...params, 
        type: action 
      });
      return result;
    } catch (error) {
      throw new Error(`Computer action failed: ${error.message}`);
    }
  }
};

export { anthropicComputerTool };