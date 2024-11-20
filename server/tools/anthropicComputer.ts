import { Tool } from '../../client/src/lib/types';
import { anthropic } from '../lib/claude';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Tool implementations that Claude expects
const computerTools = {
  async browse({ url }: { url: string }) {
    try {
      await execAsync(`DISPLAY=:0 firefox "${url}"`);
      return { type: 'browse', status: 'success', url };
    } catch (error) {
      throw new Error(`Failed to browse URL: ${error.message}`);
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
  async execute({ action }) {
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY not configured');
      }

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: action
        }],
        tools: [{
          type: 'computer_20241022',
          name: 'computer',
          display_width_px: 1024,
          display_height_px: 768,
          display_number: 1
        }]
      });

      if (response.stop_reason === 'tool_use') {
        const toolCall = response.tool_calls[0];
        // Map the tool call to our local implementation
        const toolName = toolCall.parameters.type || toolCall.name;
        const result = await computerTools[toolName](toolCall.parameters);
        return result;
      }

      return response.content[0]?.text || 'No response from Claude';
    } catch (error) {
      if (error.status === 401) {
        throw new Error('Authentication failed: Invalid API key');
      } else if (error.status === 403) {
        throw new Error('Authorization failed: Computer use not enabled for this API key');
      } else {
        throw new Error(`Computer action failed: ${error.message || 'Unknown error'}`);
      }
    }
  }
};

export { anthropicComputerTool };