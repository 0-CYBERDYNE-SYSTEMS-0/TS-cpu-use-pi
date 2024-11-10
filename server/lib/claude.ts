import Anthropic from '@anthropic-ai/sdk';
import { Message } from '../../client/src/lib/types';
import { broadcastMessage } from '../websocket';
import { executeToolCall } from '../tools';

// the newest Anthropic model is "claude-3-5-sonnet-20241022" which was released October 22, 2024
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

class ClaudeClient {
  private messages: Message[] = [];

  async sendMessage(content: string, config: any): Promise<Message> {
    const message: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now()
    };

    this.messages.push(message);
    broadcastMessage(message);

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      system: config.systemMessage,
      messages: [{ role: 'user', content }]
    });

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: response.content[0].text,
      timestamp: Date.now()
    };

    // Handle tool calls if present
    if (response.content[0].tool_calls) {
      assistantMessage.toolCalls = await Promise.all(
        response.content[0].tool_calls.map(async (toolCall) => {
          const call = {
            id: toolCall.id,
            name: toolCall.name,
            args: toolCall.arguments,
            status: 'pending' as const
          };

          try {
            const result = await executeToolCall(toolCall.name, toolCall.arguments);
            call.status = 'success';
            call.result = result;
          } catch (error) {
            call.status = 'error';
            call.result = error.message;
          }

          return call;
        })
      );
    }

    this.messages.push(assistantMessage);
    broadcastMessage(assistantMessage);

    return assistantMessage;
  }

  getMessageHistory(): Message[] {
    return this.messages;
  }
}

export const claudeClient = new ClaudeClient();
