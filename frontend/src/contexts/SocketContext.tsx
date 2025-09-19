import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import config from '../config/config'; // Fixed import path and export type

interface SocketContextType {
  socket: any | null;
  isConnected: boolean;
  joinUserRoom: (userId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const socketRef = useRef<any | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastConnectionAttemptRef = useRef<number>(0);
  const connectionInProgressRef = useRef<boolean>(false);
  const lastUserIdRef = useRef<string | null>(null);

  const joinUserRoom = (userId: string) => {
    if (socket && isConnected && userId) {
      socket.emit('join-user-room', userId);
      console.log('Joined user room for notifications:', userId);
    }
  };

  const startHealthCheck = () => {
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
    }

    healthCheckIntervalRef.current = setInterval(() => {
      if (socketRef.current && socketRef.current.connected) {
        // Ping to keep connection alive
        socketRef.current.emit('ping');
      } else if (socketRef.current && !socketRef.current.connected && user && !isConnectingRef.current) {
        console.log('Health check: Socket disconnected, attempting reconnection...');
        // Add delay to prevent rapid reconnection attempts
        setTimeout(() => {
          if (user && !isConnectingRef.current && (!socketRef.current || !socketRef.current.connected)) {
            createSocketConnection();
          }
        }, 3000);
      }
    }, 10000); // Check every 10 seconds for better stability
  };

  const stopHealthCheck = () => {
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
      healthCheckIntervalRef.current = null;
    }
  };

  const cleanupSocket = () => {
    console.log('Cleaning up socket connection...');
    
    stopHealthCheck();
    
    if (socketRef.current) {
      // Remove all event listeners
      socketRef.current.removeAllListeners();
      
      // Disconnect socket
      if (socketRef.current.connected) {
        socketRef.current.disconnect();
      }
      
      socketRef.current = null;
    }
    
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setSocket(null);
    setIsConnected(false);
    isConnectingRef.current = false;
    connectionInProgressRef.current = false;
  };

  const createSocketConnection = () => {
    console.log('createSocketConnection called:', { 
      hasUser: !!user, 
      isConnecting: isConnectingRef.current,
      connectionInProgress: connectionInProgressRef.current,
      userId: user?._id 
    });
    
    if (!user || isConnectingRef.current || connectionInProgressRef.current) {
      console.log('User not available or already connecting, skipping socket connection');
      return;
    }

    // Prevent rapid reconnection attempts
    const now = Date.now();
    const timeSinceLastAttempt = now - lastConnectionAttemptRef.current;
    if (timeSinceLastAttempt < 5000) { // 5 seconds minimum between attempts
      console.log('Too soon since last connection attempt, skipping');
      return;
    }

    // Prevent multiple simultaneous connection attempts
    if (socketRef.current && (socketRef.current.connected || socketRef.current.connecting)) {
      console.log('Socket already exists and is connected/connecting, skipping new connection');
      return;
    }

    lastConnectionAttemptRef.current = now;

    try {
      isConnectingRef.current = true;
      connectionInProgressRef.current = true;
      console.log('Creating new socket connection...');

      // Clean up existing connection first
      cleanupSocket();

      const token = localStorage.getItem('token');
      console.log('Token found:', !!token);
      if (!token) {
        console.log('No token found, skipping socket connection');
        isConnectingRef.current = false;
        return;
      }

      const newSocket = io(config.socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 15000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 5000,
        reconnectionDelayMax: 15000,
        autoConnect: true,
        upgrade: true,
        rememberUpgrade: true
      });

      socketRef.current = newSocket;

      newSocket.on('connect', () => {
        console.log('Socket connected successfully');
        setIsConnected(true);
        isConnectingRef.current = false;
        connectionInProgressRef.current = false;
        console.log('SocketContext: isConnected set to true');
        
        // Start health check
        startHealthCheck();
        
        // Join user room for notifications
        if (user._id) {
          newSocket.emit('join-user-room', user._id);
          console.log('Joined user room:', user._id);
        }
        
        // Clear any pending reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      });

      newSocket.on('disconnect', (reason: string) => {
        console.log('Socket disconnected:', reason);
        console.log('User still exists:', !!user);
        console.log('Is manual disconnect:', reason === 'io client disconnect');
        setIsConnected(false);
        isConnectingRef.current = false;
        connectionInProgressRef.current = false;
        console.log('SocketContext: isConnected set to false');
        
        // Stop health check on disconnect
        stopHealthCheck();
        
        // Only attempt to reconnect if not a manual disconnect and user still exists
        if (reason !== 'io client disconnect' && user) {
          console.log('Attempting to reconnect...');
          reconnectTimeoutRef.current = setTimeout(() => {
            if (user && !isConnectingRef.current && (!socketRef.current || !socketRef.current.connected)) {
              console.log('Reconnecting socket...');
              createSocketConnection();
            }
          }, 5000); // Increased delay for better stability
        } else {
          console.log('Manual disconnect, not reconnecting');
        }
      });

      newSocket.on('connect_error', (error: Error) => {
        console.error('Socket connection error:', error);
        console.error('Error details:', {
          message: error.message,
          type: error.name,
          stack: error.stack
        });
        setIsConnected(false);
        isConnectingRef.current = false;
        connectionInProgressRef.current = false;
        console.log('SocketContext: isConnected set to false due to error');
        
        // Don't retry if it's an authentication error
        if (error.message.includes('Authentication failed') || 
            error.message.includes('token') ||
            error.message.includes('401') ||
            error.message.includes('403')) {
          console.log('Authentication error - not retrying connection');
          return;
        }
        
        // Retry connection after delay for other errors
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          if (user && !isConnectingRef.current && (!socketRef.current || !socketRef.current.connected)) {
            console.log('Retrying socket connection...');
            createSocketConnection();
          }
        }, 5000); // Increased delay for better stability
      });

      // Listen for real-time notifications
      newSocket.on('new-notification', (notification: any) => {
        console.log('=== SOCKET NOTIFICATION RECEIVED ===');
        console.log('Notification data:', notification);
        console.log('=== END SOCKET NOTIFICATION ===');
      });

      // Handle other socket events
      newSocket.on('newMessage', (data: any) => {
        console.log('Received new message via socket:', data);
      });

      newSocket.on('user-typing', (user: any) => {
        console.log('User typing:', user);
      });

      newSocket.on('user-stopped-typing', (user: any) => {
        console.log('User stopped typing:', user);
      });

      newSocket.on('user-status-change', (data: any) => {
        console.log('User status change:', data);
      });

      // Add global error handler for socket
      newSocket.on('error', (error: any) => {
        console.error('Socket error:', error);
      });

      setSocket(newSocket);

    } catch (error) {
      console.error('Error creating socket connection:', error);
      setIsConnected(false);
      isConnectingRef.current = false;
    }
  };

  useEffect(() => {
    console.log('SocketContext useEffect triggered:', { 
      hasUser: !!user, 
      userId: user?._id, 
      hasSocket: !!socketRef.current, 
      isConnected,
      connectionInProgress: connectionInProgressRef.current,
      isConnecting: isConnectingRef.current
    });
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    console.log('Token in localStorage:', !!token);
    
    if (user && user._id && token) {
      // Only create connection if user ID actually changed
      if (lastUserIdRef.current !== user._id) {
        lastUserIdRef.current = user._id;
        
        // Only create connection if we don't have one or if user ID changed
        if (!socketRef.current || (!socketRef.current.connected && !socketRef.current.connecting)) {
          if (!connectionInProgressRef.current) {
            console.log('User available with token, creating socket connection...');
            createSocketConnection();
          } else {
            console.log('Connection already in progress, skipping...');
          }
        } else {
          console.log('Socket already exists and connected/connecting, skipping creation');
        }
      } else {
        console.log('Same user ID, no need to recreate connection');
      }
    } else {
      console.log('User not available or no token, cleaning up socket...');
      lastUserIdRef.current = null;
      cleanupSocket();
    }

    // Cleanup on unmount or user change
    return () => {
      // Don't cleanup immediately, let the connection persist
      console.log('Socket effect cleanup - keeping connection alive');
    };
  }, [user?._id]); // Only recreate connection when user ID changes

  // Handle tab visibility changes to maintain connection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && socket && !socket.connected) {
        console.log('Tab became visible, checking socket connection...');
        // Small delay to ensure the tab is fully active
        setTimeout(() => {
          if (user && socket && !socket.connected && !isConnectingRef.current) {
            console.log('Reconnecting socket after tab became visible...');
            createSocketConnection();
          }
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSocket();
    };
  }, []);

  const value = {
    socket,
    isConnected,
    joinUserRoom
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
