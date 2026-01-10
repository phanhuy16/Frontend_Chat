import * as signalR from '@microsoft/signalr';
import { useAuth } from './useAuth';
import { useCallback, useEffect, useRef, useState } from 'react';

// Global maps to manage multiple connections
const globalConnections = new Map<string, signalR.HubConnection>();
const globalConnectionPromises = new Map<string, Promise<void>>();

export const useSignalR = (hubUrl: string) => {
  const { token, refreshAuthToken, logout } = useAuth();
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const isMountedRef = useRef(true);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Track registered event handlers to prevent duplicates
  const registeredHandlersRef = useRef<Map<string, (...args: any[]) => void>>(new Map());

  // Queue for event listeners before connection is ready
  const eventQueueRef = useRef<{ event: string; handler: (...args: any[]) => void }[]>([]);

  // Process queued event listeners
  const processEventQueue = useCallback(() => {
    const connection = globalConnections.get(hubUrl);
    if (!connection) return;

    while (eventQueueRef.current.length > 0) {
      const { event, handler } = eventQueueRef.current.shift()!;
      connection.on(event, handler);
      registeredHandlersRef.current.set(event, handler);
    }
  }, [hubUrl]);

  const connect = useCallback(async () => {
    if (!token) {
      if (isMountedRef.current) {
        setIsConnecting(false);
      }
      return;
    }

    // Check existing connection
    const existingConnection = globalConnections.get(hubUrl);
    if (existingConnection?.state === signalR.HubConnectionState.Connected) {
      connectionRef.current = existingConnection;

      if (isMountedRef.current) {
        setIsConnected(true);
        setIsConnecting(false);
      }

      processEventQueue();
      return;
    }

    // Check existing promise
    let existingPromise = globalConnectionPromises.get(hubUrl);
    if (existingPromise) {
      try {
        await existingPromise;
        if (isMountedRef.current) {
          const conn = globalConnections.get(hubUrl);
          if (conn) {
            connectionRef.current = conn;
            setIsConnected(true);
            setIsConnecting(false);
          }
        }

        processEventQueue();
        return;
      } catch (error) {
        console.error('Failed waiting for connection:', error);
        globalConnectionPromises.delete(hubUrl);
        existingPromise = undefined;
      }
    }

    if (isConnecting) {
      return;
    }

    setIsConnecting(true);

    try {
      const connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => token,
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
          withCredentials: true,
        })
        .withAutomaticReconnect([0, 0, 0, 1000, 3000, 5000])
        .configureLogging(signalR.LogLevel.Warning) 
        .build();

      connection.on('Error', (error: string) => {
        console.error('Hub error:', error);
      });

      connection.onreconnecting(() => {
        if (isMountedRef.current) {
          setIsConnected(false);
        }
      });

      connection.onreconnected(() => {
        if (isMountedRef.current) {
          setIsConnected(true);
        }
        processEventQueue();
      });

      connection.onclose(() => {
        if (isMountedRef.current) {
          setIsConnected(false);
          setIsConnecting(false);
        }
        globalConnections.delete(hubUrl);
        globalConnectionPromises.delete(hubUrl);
      });

      const startPromise = connection.start();
      globalConnectionPromises.set(hubUrl, startPromise);

      await startPromise;

      globalConnections.set(hubUrl, connection);
      connectionRef.current = connection;
      reconnectAttemptsRef.current = 0;

      if (isMountedRef.current) {
        setIsConnected(true);
        setIsConnecting(false);
      }

      processEventQueue();

    } catch (error: any) {
      console.error('SignalR connection error:', error);
      globalConnectionPromises.delete(hubUrl);

      if (isMountedRef.current) {
        setIsConnecting(false);
      }

      // Handle 401 specifically
      if (error?.toString().includes('401') || error?.message?.includes('401') || error?.toString().includes('Unauthorized')) {
        console.log('Received 401 from SignalR, attempting token refresh...');
        reconnectAttemptsRef.current = maxReconnectAttempts + 1; // Stop retry loop

        try {
          const refreshed = await refreshAuthToken({
            token: localStorage.getItem('token') || '',
            refreshToken: localStorage.getItem('refreshToken') || ''
          });

          if (!refreshed) {
            console.log('Token refresh failed, logging out');
            logout();
          }
          // If refreshed, the token dependency will trigger a re-connect automatically
          return;
        } catch (refreshError) {
          console.error('Error during token refresh:', refreshError);
          logout();
          return;
        }
      }

      // Retry connection after delay
      reconnectAttemptsRef.current += 1;
      const delayMs = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);

      if (reconnectAttemptsRef.current <= maxReconnectAttempts) {
        const timeoutId = setTimeout(() => {
          if (isMountedRef.current) {
            connect();
          }
        }, delayMs);

        return () => clearTimeout(timeoutId);
      } else {
        console.error(`Max reconnect attempts (${maxReconnectAttempts}) reached`);
      }
    }
  }, [token, hubUrl, isConnecting, processEventQueue, refreshAuthToken, logout]);

  const disconnect = useCallback(async () => {
    try {
      const connection = globalConnections.get(hubUrl);
      if (connection && connection.state === signalR.HubConnectionState.Connected) {
        await connection.stop();
      }
    } catch (error) {
      console.error('Error disconnecting SignalR:', error);
    } finally {
      globalConnections.delete(hubUrl);
      globalConnectionPromises.delete(hubUrl);
      registeredHandlersRef.current.clear();
      eventQueueRef.current = [];

      if (isMountedRef.current) {
        setIsConnected(false);
        setIsConnecting(false);
      }
    }
  }, [hubUrl]);

  const invoke = useCallback(async (methodName: string, ...args: any[]) => {
    // Wait for connection
    let connection = globalConnections.get(hubUrl);

    if (!connection) {
      // if we have a promise, wait for it
      const promise = globalConnectionPromises.get(hubUrl);
      if (promise) {
        try {
          await promise;
          connection = globalConnections.get(hubUrl);
        } catch (e) {
          throw e;
        }
      }
    }

    if (!connection) {
      throw new Error('Not connected');
    }

    if (connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error(`Connection state: ${connection.state}`);
    }

    return connection
      .invoke(methodName, ...args)
      .then(() => console.log(`${methodName} succeeded`))
      .catch((err) => {
        console.error(`${methodName} failed:`, err);
        throw err;
      });
  }, [hubUrl]);

  const on = useCallback((eventName: string, handler: (...args: any[]) => void) => {
    const connection = globalConnections.get(hubUrl);

    if (!connection) {
      eventQueueRef.current.push({ event: eventName, handler });
      return;
    }

    connection.on(eventName, handler);
    registeredHandlersRef.current.set(eventName, handler);
  }, [hubUrl]);

  const off = useCallback((eventName: string) => {
    // Remove from queue if it hasn't been blocked yet
    eventQueueRef.current = eventQueueRef.current.filter(item => item.event !== eventName);

    const connection = globalConnections.get(hubUrl);

    if (!connection) {
      // Not connected yet, but we successfully removed from queue
      return;
    }

    const handler = registeredHandlersRef.current.get(eventName);
    if (handler) {
      connection.off(eventName, handler);
      registeredHandlersRef.current.delete(eventName);
    }
  }, [hubUrl]);

  useEffect(() => {
    isMountedRef.current = true;

    if (token) {
      connect();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [token, connect]);

  return {
    connection: connectionRef.current,
    isConnected,
    isConnecting,
    invoke,
    on,
    off,
    disconnect,
  };
};