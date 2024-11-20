import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const defaultTools = [{
  type: 'computer_20241022',
  name: 'computer',
  display_width_px: 1024,
  display_height_px: 768,
  display_number: 1
}];

export const claudeClient = {
  async sendMessage(message: string, config: any) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        system: config.systemMessage,
        messages: [{ role: 'user', content: message }],
        tools: defaultTools
      });

      const responseMessage = {
        role: 'assistant',
        content: response.content[0].text
      };

      return responseMessage;
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }
};

export { anthropic, defaultTools };
