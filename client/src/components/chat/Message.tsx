import { Message as MessageType } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MessageProps {
  message: MessageType;
}

export function Message({ message }: MessageProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={cn('flex', isAssistant ? 'justify-start' : 'justify-end')}>
      <Card className={cn(
        'max-w-[80%] p-4',
        isAssistant ? 'bg-secondary' : 'bg-primary text-primary-foreground'
      )}>
        <div className="prose dark:prose-invert">
          {message.content}
        </div>
        {message.toolCalls && (
          <div className="mt-2 text-sm border-t pt-2">
            {message.toolCalls.map((tool) => (
              <div key={tool.id} className="flex items-center gap-2">
                <span className="font-medium">{tool.name}:</span>
                <span className={cn(
                  'text-xs',
                  tool.status === 'success' ? 'text-green-500' :
                  tool.status === 'error' ? 'text-red-500' :
                  'text-yellow-500'
                )}>
                  {tool.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
