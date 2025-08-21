import { useState } from 'react';

export function useRealtimeApy() {
  // WebSocket functionality disabled per user request
  const [isConnected] = useState(false);
  const [lastUpdate] = useState<number | null>(null);

  const connect = () => {
    // WebSocket functionality disabled per user request
    return;
  };

  return {
    isConnected,
    lastUpdate,
    reconnect: connect
  };
}