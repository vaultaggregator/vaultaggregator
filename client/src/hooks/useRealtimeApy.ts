import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface ApyUpdate {
  type: 'apy_update';
  poolId: string;
  apy: string;
  timestamp: number;
}

interface ConnectionMessage {
  type: 'connection';
  status: 'connected';
  timestamp: number;
}

type WebSocketMessage = ApyUpdate | ConnectionMessage;

export function useRealtimeApy() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = () => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('📡 Connecting to WebSocket for real-time APY updates...');
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('📡 WebSocket connected - real-time APY updates active');
        setIsConnected(true);
        setLastUpdate(Date.now());
        
        // Clear any reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          if (message.type === 'apy_update') {
            console.log(`💰 LIVE APY UPDATE: Pool ${message.poolId} = ${message.apy}%`);
            
            // Update all relevant query caches immediately with specific targeting
            queryClient.invalidateQueries({ queryKey: ['/api/pools'] });
            queryClient.invalidateQueries({ queryKey: [`/api/pools/${message.poolId}`] });
            queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
            
            // Force refetch data immediately
            queryClient.refetchQueries({ queryKey: ['/api/pools'] });
            
            setLastUpdate(message.timestamp);
            
            // Show visual confirmation of update
            console.log(`🔄 Cache invalidated and data refreshed at ${new Date(message.timestamp).toLocaleTimeString()}`);
          } else if (message.type === 'connection') {
            console.log('📡 WebSocket connection confirmed');
            setLastUpdate(message.timestamp);
          }
        } catch (error) {
          console.error('📡 Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('📡 WebSocket disconnected - attempting reconnect...');
        setIsConnected(false);
        
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('📡 WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('📡 Error creating WebSocket connection:', error);
      setIsConnected(false);
      
      // Retry connection after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    isConnected,
    lastUpdate,
    reconnect: connect
  };
}