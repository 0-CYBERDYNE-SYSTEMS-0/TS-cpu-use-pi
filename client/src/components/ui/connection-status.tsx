import { useEffect, useState } from 'react';
import { wsClient } from '@/lib/websocket';
import { cn } from '@/lib/utils';

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    return wsClient.onConnection((status) => setIsConnected(status));
  }, []);

  if (isConnected) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-md shadow-lg animate-pulse">
      Reconnecting to server...
    </div>
  );
}
