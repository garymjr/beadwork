import { useEffect, useRef, useState, useCallback } from 'react';

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

interface UseBeadsWatcherOptions {
  projectPath: string;
  onUpdate?: () => void;
  reconnectInterval?: number;
}

interface BeadsWatcherMessage {
  type: string;
  projectPath: string;
  timestamp: string;
}

export function useBeadsWatcher({
  projectPath,
  onUpdate,
  reconnectInterval = 3000,
}: UseBeadsWatcherOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(true);
  const manualCloseRef = useRef(false);

  const connect = useCallback(() => {
    if (!activeRef.current || !projectPath) {
      return;
    }

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    setStatus('connecting');

    const wsUrl = `ws://localhost:3001/ws?projectPath=${encodeURIComponent(projectPath)}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      if (!activeRef.current) {
        ws.close();
        return;
      }
      console.log('WebSocket connected');
      setStatus('connected');
      wsRef.current = ws;
      
      // Clear any pending reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const message: BeadsWatcherMessage = JSON.parse(event.data);
        console.log('WebSocket message received:', message);

        if (message.type === 'beads-update' && onUpdate) {
          onUpdate();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      wsRef.current = null;

      // Only reconnect if this wasn't a manual close and component is still active
      if (activeRef.current && !manualCloseRef.current) {
        setStatus('disconnected');
        
        // Attempt to reconnect
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, reconnectInterval);
      }
    };
  }, [projectPath, reconnectInterval, onUpdate]);

  const disconnect = useCallback(() => {
    manualCloseRef.current = true;
    activeRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setStatus('disconnected');
  }, []);

  useEffect(() => {
    // Reset state on projectPath change
    manualCloseRef.current = false;
    activeRef.current = true;
    
    if (projectPath) {
      connect();
    }

    return () => {
      disconnect();
    };
    // Only depend on projectPath and disconnect - connect changes should not trigger re-run
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectPath]);

  return {
    status,
    isConnected: status === 'connected',
  };
}
