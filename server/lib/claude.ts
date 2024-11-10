import Anthropic from '@anthropic-ai/sdk';
import { Message, ToolCall } from '../../client/src/lib/types';
import { broadcastMessage } from '../websocket';
import { executeToolCall } from '../tools';

// the newest Anthropic model is "claude-3-5-sonnet-20241022" which was released October 22, 2024
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ConversationContext {
  messages: Array<{ role: string; content: string; }>;
  lastToolCalls?: ToolCall[];
}

class ClaudeClient {
  private messages: Message[] = [];
  private contexts: Map<string, ConversationContext> = new Map();

  async sendMessage(content: string, config: any): Promise<Message> {
    try {
      const contextId = 'default'; // For now using a single context
      const context = this.getOrCreateContext(contextId);
      
      const message: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: Date.now()
      };

      // Update context with user message
      context.messages.push({ role: 'user', content });
      this.messages.push(message);
      broadcastMessage(message);

      // Include tool results from previous interactions if any
      let systemPrompt = config.systemMessage;
      if (context.lastToolCalls) {
        const toolResults = context.lastToolCalls
          .map(call => `Tool ${call.name} returned: ${JSON.stringify(call.result)}`)
          .join('\n');
        systemPrompt += `\nRecent tool results:\n${toolResults}`;
      }

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        system: systemPrompt,
        messages: context.messages
      });

      if (!response.content[0]?.text) {
        throw new Error('Invalid response from Claude API');
      }

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
              call.result = error instanceof Error ? error.message : 'Unknown error occurred';
            }

            return call;
          })
        );

        // Store tool calls in context for next interaction
        context.lastToolCalls = assistantMessage.toolCalls;
      }

      // Update context with assistant's response
      context.messages.push({ 
        role: 'assistant', 
        content: assistantMessage.content 
      });

      this.messages.push(assistantMessage);
      broadcastMessage(assistantMessage);

      return assistantMessage;
    } catch (error) {
      console.error('Error in Claude API call:', error);
      throw new Error(
        error instanceof Error 
          ? `Failed to process message: ${error.message}`
          : 'Failed to process message: Unknown error occurred'
      );
    }
  }

  private getOrCreateContext(contextId: string): ConversationContext {
    if (!this.contexts.has(contextId)) {
      this.contexts.set(contextId, {
        messages: []
      });
    }
    return this.contexts.get(contextId)!;
  }

  getMessageHistory(): Message[] {
    return this.messages;
  }

  clearContext(contextId: string = 'default') {
    this.contexts.delete(contextId);
  }
}

export const claudeClient = new ClaudeClient();
