import { Message as MessageType } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Clock, Terminal } from 'lucide-react';

interface MessageProps {
  message: MessageType;
}

export function Message({ message }: MessageProps) {
  const isAssistant = message.role === 'assistant';

  const getToolIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn('flex', isAssistant ? 'justify-start' : 'justify-end')}>
      <Card className={cn(
        'max-w-[80%] p-4',
        isAssistant ? 'bg-secondary' : 'bg-primary text-primary-foreground'
      )}>
        <div className="prose dark:prose-invert">
          {message.content}
        </div>
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 space-y-2 border-t pt-2">
            {message.toolCalls.map((tool) => (
              <div key={tool.id} className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  <span className="font-medium">{tool.name}</span>
                  {getToolIcon(tool.status)}
                </div>
                <div className="pl-6">
                  <div className="text-xs text-muted-foreground">
                    Args: {JSON.stringify(tool.args)}
                  </div>
                  {tool.result && (
                    <div className={cn(
                      'mt-1 text-xs p-1 rounded',
                      tool.status === 'success' ? 'bg-green-100 dark:bg-green-900/20' :
                      tool.status === 'error' ? 'bg-red-100 dark:bg-red-900/20' : ''
                    )}>
                      Result: {typeof tool.result === 'string' ? tool.result : JSON.stringify(tool.result)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
