import Anthropic from '@anthropic-ai/sdk';
import { Message, ToolCall } from '../../client/src/lib/types';
import { broadcastMessage } from '../websocket';
import { executeToolCall } from '../tools';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': 'computer-use-2024-10-22'
  }
});

// Add computer use system prompt
export const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant with access to computer control capabilities. You can:
- Use the mouse and keyboard
- Navigate web pages
- Read and write files
- Execute terminal commands

Always confirm before taking destructive actions.`;

export { anthropic };

interface ConversationContext {
  messages: Anthropic.MessageParam[];
  lastToolCalls?: ToolCall[];
}

class ClaudeClient {
  private messages: Message[] = [];
  private contexts: Map<string, ConversationContext> = new Map();

  async sendMessage(content: string, config: any): Promise<Message> {
    try {
      const contextId = 'default';
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

      // Parse tool calls from previous assistant messages
      const toolCallPattern = /<tool>(\w+):(\{.*?\})<\/tool>/g;
      let toolCalls: ToolCall[] = [];

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        system: systemPrompt,
        messages: context.messages
      });

      const responseContent = response.content[0].type === 'text' 
        ? response.content[0].text 
        : '';

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: responseContent,
        timestamp: Date.now()
      };

      // Extract tool calls from the response
      let match;
      while ((match = toolCallPattern.exec(responseContent)) !== null) {
        const [_, name, argsString] = match;
        try {
          const args = JSON.parse(argsString);
          const toolCall: ToolCall = {
            id: crypto.randomUUID(),
            name,
            args,
            status: 'pending'
          };
          toolCalls.push(toolCall);
        } catch (error) {
          console.error('Failed to parse tool call:', error);
        }
      }

      // Execute tool calls if present
      if (toolCalls.length > 0) {
        assistantMessage.toolCalls = await Promise.all(
          toolCalls.map(async (toolCall) => {
            try {
              const result = await executeToolCall(toolCall.name, toolCall.args);
              return {
                ...toolCall,
                status: 'success' as const,
                result
              };
            } catch (error) {
              return {
                ...toolCall,
                status: 'error' as const,
                result: error instanceof Error ? error.message : 'Unknown error occurred'
              };
            }
          })
        );

        // Store tool calls in context for next interaction
        context.lastToolCalls = assistantMessage.toolCalls;
      }

      // Update context with assistant's response
      context.messages.push({ 
        role: 'assistant', 
        content: responseContent 
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
    this.messages = [];
  }
}

export const claudeClient = new ClaudeClient();
