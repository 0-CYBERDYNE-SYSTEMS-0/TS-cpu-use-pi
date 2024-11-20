import { Tool } from '../../client/src/lib/types';
import { anthropic, defaultTools } from '../lib/claude';

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
        tools: defaultTools
      });

      return response.content[0].text;
    } catch (error) {
      throw new Error(`Computer action failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

export { anthropicComputerTool };