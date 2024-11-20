import { WebSocket } from 'ws';
import { Message, ToolCall } from '../client/src/lib/types';

const clients = new Set<WebSocket>();

export function handleWebSocket(ws: WebSocket) {
  clients.add(ws);

  // Send initial connection success message
  ws.send(JSON.stringify({ type: 'connection', status: 'connected' }));

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });

  ws.on('close', () => {
    clients.delete(ws);
  });

  // Ping to keep connection alive
  const pingInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.ping();
    } else {
      clearInterval(pingInterval);
    }
  }, 30000);

  ws.on('pong', () => {
    // Connection is alive
  });
}

export function broadcastMessage(message: Message) {
  const data = JSON.stringify({ type: 'message', message });
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

export function broadcastToolCall(toolCall: ToolCall) {
  const data = JSON.stringify({ type: 'toolCall', toolCall });
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}
