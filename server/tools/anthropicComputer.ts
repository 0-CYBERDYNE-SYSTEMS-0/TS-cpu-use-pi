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
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
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

      return response.content[0].text;
    } catch (error) {
      throw new Error(`Computer action failed: ${error.message}`);
    }
  }
};

export { anthropicComputerTool };