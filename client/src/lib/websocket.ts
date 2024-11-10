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
  private maxReconnectDelay = 5000;
  private connected = false;

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    this.ws.onopen = () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionStatus(true);
      console.log('WebSocket connected');
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
        console.log('WebSocket disconnected');
      }
      this.reconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.ws?.close();
    };
  }

  private reconnect() {
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    this.reconnectAttempts++;
    
    console.log(`Attempting to reconnect in ${delay}ms...`);
    setTimeout(() => this.connect(), delay);
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
