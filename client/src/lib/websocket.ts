import { Message, ToolCall } from './types';

type MessageHandler = (message: Message) => void;
type ToolCallHandler = (toolCall: ToolCall) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private toolCallHandlers: Set<ToolCallHandler> = new Set();

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message') {
        this.messageHandlers.forEach(handler => handler(data.message));
      } else if (data.type === 'toolCall') {
        this.toolCallHandlers.forEach(handler => handler(data.toolCall));
      }
    };

    this.ws.onclose = () => {
      setTimeout(() => this.connect(), 1000);
    };
  }

  onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onToolCall(handler: ToolCallHandler) {
    this.toolCallHandlers.add(handler);
    return () => this.toolCallHandlers.delete(handler);
  }
}

export const wsClient = new WebSocketClient();
