import { ChatInput } from '@/components/chat/ChatInput';
import { MessageList } from '@/components/chat/MessageList';
import { useState, useEffect } from 'react';
import { Message } from '@/types';
import { WebSocketClient } from '@/lib/websocket';

const wsClient = new WebSocketClient();

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  
  useEffect(() => {
    const unsubscribe = wsClient.onMessage((message) => {
      setMessages(prev => [...prev, message]);
    });
    return () => unsubscribe();
  }, []);

  const sendMessage = async (content: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content })
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} />
      </div>
      <ChatInput sendMessage={sendMessage} />
    </div>
  );
}
