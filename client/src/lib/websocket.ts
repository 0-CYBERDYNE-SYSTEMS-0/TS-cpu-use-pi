import { Message, ToolCall } from './types';

type MessageHandler = (message: Message) => void;
type ToolCallHandler = (toolCall: ToolCall) => void;
type ConnectionHandler = (status: boolean) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private toolCallHandlers: Set<ToolCallHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private reconnectAttempts = 0;
  private maxRetries = 3;
  private retryInterval = 2000;
  private connected = false;

  connect(options?: { maxRetries?: number; retryInterval?: number }) {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const port = '5001';
    this.ws = new WebSocket(`${protocol}//${window.location.hostname}:${port}/ws`);

    this.ws.onopen = () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionStatus(true);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          this.messageHandlers.forEach(handler => handler(data.message));
        } else if (data.type === 'toolCall') {
          this.toolCallHandlers.forEach(handler => handler(data.toolCall));
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      if (this.connected) {
        this.connected = false;
        this.notifyConnectionStatus(false);
        if (this.reconnectAttempts < this.maxRetries) {
          setTimeout(() => this.connect(), this.retryInterval);
        }
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.ws?.close();
    };
  }

  private notifyConnectionStatus(status: boolean) {
    this.connectionHandlers.forEach(handler => handler(status));
  }

  onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onToolCall(handler: ToolCallHandler) {
    this.toolCallHandlers.add(handler);
    return () => this.toolCallHandlers.delete(handler);
  }

  onConnection(handler: ConnectionHandler) {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  isConnected() {
    return this.connected;
  }
}

export const wsClient = new WebSocketClient();
