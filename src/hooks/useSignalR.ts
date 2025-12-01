import * as signalR from '@microsoft/signalr';
import { useAuth } from './useAuth';
import { useCallback, useEffect, useRef, useState } from 'react';

// Global instance to prevent multiple connections
let globalConnection: signalR.HubConnection | null = null;
let globalConnectionPromise: Promise<void> | null = null;

export const useSignalR = (hubUrl: string) => {
  const { token } = useAuth();
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const isMountedRef = useRef(true);

  const connect = useCallback(async () => {
    if (!token) {
      console.warn('No token available');
      return;
    }

    // Use global connection if already exists and connected
    if (globalConnection?.state === signalR.HubConnectionState.Connected) {
      connectionRef.current = globalConnection;

      if (isMountedRef.current) {
        setIsConnected(true);
      }
      return;
    }

    // If connection is in progress, wait for it
    if (globalConnectionPromise) {
      try {
        await globalConnectionPromise;
        if (isMountedRef.current) {
          connectionRef.current = globalConnection;
          setIsConnected(true);
        }
        return;
      } catch (error) {
        console.error('Failed waiting for connection:', error);
        globalConnectionPromise = null;
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
        .configureLogging(signalR.LogLevel.Information)
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
      });

      connection.onclose(() => {
        if (isMountedRef.current) {
          setIsConnected(false);
          setIsConnecting(false);
        }
        globalConnection = null;
        globalConnectionPromise = null;
      });

      globalConnectionPromise = connection.start();

      await globalConnectionPromise;

      globalConnection = connection;
      connectionRef.current = connection;

      if (isMountedRef.current) {
        setIsConnected(true);
        setIsConnecting(false);
      }

    } catch (error) {
      console.error('SignalR connection error:', error);
      globalConnectionPromise = null;

      if (isMountedRef.current) {
        setIsConnecting(false);
      }
      // Retry connection after delay
      setTimeout(() => {
        if (isMountedRef.current) {
          connect();
        }
      }, 5000);
    }
  }, [token, hubUrl, isConnecting]);

  const disconnect = useCallback(async () => {
    if (isMountedRef.current) {
      setIsConnected(false);
    }
  }, []);

  const invoke = useCallback(async (methodName: string, ...args: any[]) => {
    // Wait for global connection
    if (!globalConnection) {
      throw new Error('Not connected');
    }

    if (globalConnectionPromise) {
      try {
        await globalConnectionPromise;
      } catch (error) {
        console.error('Failed to connect:', error);
        throw error;
      }
    }

    if (globalConnection.state !== signalR.HubConnectionState.Connected) {
      throw new Error(`Connection state: ${globalConnection.state}`);
    }

    return globalConnection
      .invoke(methodName, ...args)
      .then(() => console.log(`${methodName} succeeded`))
      .catch((err) => {
        console.error(`${methodName} failed:`, err);
        throw err;
      });
  }, []);

  const eventQueue = useRef<{ event: string; handler: (...args: any[]) => void }[]>([]);

  const on = useCallback((eventName: string, handler: (...args: any[]) => void) => {

    if (globalConnection) {
      globalConnection.on(eventName, handler);
    } else {
      console.log(`Connection not ready, queueing listener: ${eventName}`);
      eventQueue.current.push({ event: eventName, handler });
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    connect();

    return () => {
      isMountedRef.current = false;
    };
  }, [connect]);

  return {
    connection: connectionRef.current,
    isConnected,
    isConnecting,
    invoke,
    on,
    disconnect,
  };
};