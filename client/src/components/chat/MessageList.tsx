import { useEffect, useRef } from 'react';
import { Message as MessageType } from '@/lib/types';
import { Message } from './Message';
import { ScrollArea } from '@/components/ui/scroll-area';
import { wsClient } from '@/lib/websocket';
import useSWR from 'swr';
import { getMessageHistory } from '@/lib/api';

export function MessageList() {
  const { data: messages = [], mutate } = useSWR<MessageType[]>('/api/messages', getMessageHistory);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = wsClient.onMessage((message) => {
      mutate((prev) => [...(prev || []), message], false);
    });
    return unsubscribe;
  }, [mutate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
