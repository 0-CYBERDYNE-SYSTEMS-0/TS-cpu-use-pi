import { Tool } from '../../client/src/lib/types';
import { anthropic } from '../lib/claude';

const anthropicComputerTool: Tool = {
  name: 'computer',
  description: 'Interact with the computer using mouse, keyboard, file system, and execute commands',
  enabled: true,
  parameters: {
    action: {
      type: 'string',
      description: 'The action to perform'
    },
    parameters: {
      type: 'object',
      optional: true,
      description: 'Additional parameters for the action'
    }
  },
  async execute({ action, parameters }) {
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY not configured');
      }

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        temperature: 0.7,
        system: "You are a helpful computer control assistant.",
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

      if (!response.content || !response.content[0]?.text) {
        throw new Error('Invalid response from Claude API');
      }

      return response.content[0].text;
    } catch (error) {
      if (error.status === 401) {
        throw new Error('Authentication failed: Invalid API key');
      } else if (error.status === 403) {
        throw new Error('Authorization failed: Computer use not enabled for this API key');
      } else if (error.name === 'AbortError') {
        throw new Error('Request timed out while executing computer action');
      } else if (error instanceof TypeError) {
        throw new Error(`Invalid parameters: ${error.message}`);
      } else {
        throw new Error(`Computer action failed: ${error.message || 'Unknown error'}`);
      }
    }
  }
};

export { anthropicComputerTool };