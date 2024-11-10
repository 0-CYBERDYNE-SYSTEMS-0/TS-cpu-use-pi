import { useEffect, useRef } from 'react';
import { Message as MessageType } from '@/lib/types';
import { Message } from './Message';
import { ScrollArea } from '@/components/ui/scroll-area';
import { wsClient } from '@/lib/websocket';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import useSWR from 'swr';
import { getMessageHistory } from '@/lib/api';

export function MessageList() {
  const { 
    data: messages = [], 
    error, 
    mutate, 
    isLoading 
  } = useSWR<MessageType[]>('/api/messages', getMessageHistory, {
    refreshInterval: 0, // Only refresh on mutation
    revalidateOnFocus: false
  });
  
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

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-4">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load messages: {error instanceof Error ? error.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No messages yet. Start a conversation!
          </div>
        ) : (
          messages.map((message) => (
            <Message key={message.id} message={message} />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
