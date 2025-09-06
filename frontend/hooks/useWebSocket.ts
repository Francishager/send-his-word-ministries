import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseWebSocketOptions {
  /** Called when a message arrives (already parsed if JSON). */
  onMessage?: (msg: any, raw: MessageEvent) => void;
  /** Optional function to serialize outbound messages (defaults to JSON.stringify) */
  serialize?: (data: any) => string;
  /** Optional function to parse inbound messages (defaults to JSON.parse with fallback to text) */
  parse?: (data: string) => any;
  /** Reconnect delay in ms */
  reconnectDelayMs?: number;
  /** Max reconnect attempts (0 = infinite) */
  maxReconnects?: number;
}

/**
 * useWebSocket - minimal client hook for establishing a WS connection.
 * - urlProvider: function returning the ws(s) URL to connect (can include auth query param)
 * - deps: dependency array that, when changed, re-establishes the connection
 */
export function useWebSocket(
  urlProvider: () => string | null,
  deps: any[] = [],
  options: UseWebSocketOptions = {}
) {
  const {
    onMessage,
    serialize = JSON.stringify,
    parse = (data: string) => {
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    },
    reconnectDelayMs = 2000,
    maxReconnects = 0,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectsRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    const url = urlProvider();
    if (!url) return;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      setError(null);

      ws.onopen = () => {
        setReady(true);
        reconnectsRef.current = 0;
      };
      ws.onclose = () => {
        setReady(false);
        if (maxReconnects === 0 || reconnectsRef.current < maxReconnects) {
          reconnectsRef.current += 1;
          setTimeout(connect, reconnectDelayMs);
        }
      };
      ws.onerror = (evt) => {
        setError('WebSocket error');
      };
      ws.onmessage = (evt) => {
        const payload = typeof evt.data === 'string' ? parse(evt.data) : evt.data;
        onMessage?.(payload, evt);
      };
    } catch (e: any) {
      setError(e?.message || 'Failed to establish WebSocket');
    }
  }, [urlProvider, reconnectDelayMs, maxReconnects, onMessage, parse]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps); // re-connect when deps change

  const send = useCallback(
    (data: any) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return false;
      const out = typeof data === 'string' ? data : serialize(data);
      wsRef.current.send(out);
      return true;
    },
    [serialize]
  );

  return { ready, error, send };
}

export default useWebSocket;
