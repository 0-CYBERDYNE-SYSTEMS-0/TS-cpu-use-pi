import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { sendMessage } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { mutate } from 'swr';
import useSWR from 'swr';

export function ChatInput() {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { data: messages = [] } = useSWR('/api/messages');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || sending) return;

    setError(null);
    setSending(true);
    
    try {
      await sendMessage(message);
      setMessage('');
      // Optimistically update the message list
      mutate('/api/messages');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  }

  // Check if assistant is typing (when last message is from user)
  const isAssistantTyping = sending && messages.length > 0 && 
    messages[messages.length - 1]?.role === 'user';

  return (
    <div className="space-y-2">
      {error && (
        <Alert variant="destructive" className="mx-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {isAssistantTyping && (
        <div className="flex items-center gap-2 px-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Assistant is typing...
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="min-h-[60px]"
          disabled={sending}
        />
        <Button 
          type="submit" 
          disabled={sending || !message.trim()} 
          size="icon"
          className={sending ? 'opacity-50 cursor-not-allowed' : ''}
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
