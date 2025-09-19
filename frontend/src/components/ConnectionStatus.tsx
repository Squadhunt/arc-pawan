import React, { useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { Wifi, WifiOff, AlertCircle, User, Loader2, RefreshCw } from 'lucide-react';

const ConnectionStatus: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const { user, loading } = useAuth();
  const [connectionLostTime, setConnectionLostTime] = useState<number | null>(null);
  const [autoRestartCountdown, setAutoRestartCountdown] = useState<number | null>(null);
  const [showRetryButton, setShowRetryButton] = useState(false);

  // Auto-restart configuration
  const AUTO_RESTART_DELAY = 30000; // 30 seconds
  const MAX_AUTO_RESTARTS = 3;
  const [autoRestartAttempts, setAutoRestartAttempts] = useState(0);

  useEffect(() => {
    let countdownInterval: NodeJS.Timeout | null = null;

    if (!isConnected && user && socket) {
      // Connection lost
      if (!connectionLostTime) {
        setConnectionLostTime(Date.now());
        setShowRetryButton(true);
      }

      // Start auto-restart countdown
      if (autoRestartAttempts < MAX_AUTO_RESTARTS) {
        const timeLeft = Math.max(0, AUTO_RESTART_DELAY - (Date.now() - (connectionLostTime || Date.now())));
        setAutoRestartCountdown(Math.ceil(timeLeft / 1000));

        countdownInterval = setInterval(() => {
          const remaining = Math.max(0, AUTO_RESTART_DELAY - (Date.now() - (connectionLostTime || Date.now())));
          setAutoRestartCountdown(Math.ceil(remaining / 1000));

          if (remaining <= 0) {
            // Auto-restart
            setAutoRestartAttempts(prev => prev + 1);
            window.location.reload();
          }
        }, 1000);
      }
    } else if (isConnected) {
      // Connection restored
      setConnectionLostTime(null);
      setAutoRestartCountdown(null);
      setShowRetryButton(false);
      setAutoRestartAttempts(0);
    }

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [isConnected, user, socket, connectionLostTime, autoRestartAttempts]);

  const handleManualRetry = () => {
    setAutoRestartAttempts(prev => prev + 1);
    window.location.reload();
  };

  const getStatusColor = () => {
    if (loading) return 'text-blue-500';
    if (!user) return 'text-gray-500';
    if (!socket) return 'text-red-500';
    if (isConnected) return 'text-green-500';
    return 'text-yellow-500';
  };

  const getStatusText = () => {
    if (loading) return 'Loading...';
    if (!user) return 'Not Logged In';
    if (!socket) return 'No Socket';
    if (isConnected) return 'Connected';
    return 'Connecting...';
  };

  const getStatusIcon = () => {
    if (loading) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (!user) return <User className="w-4 h-4" />;
    if (!socket) return <WifiOff className="w-4 h-4" />;
    if (isConnected) return <Wifi className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  // Don't show connection status if user is not logged in
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Main connection status */}
      <div className={`fixed top-4 right-4 z-50 flex items-center space-x-2 px-3 py-2 rounded-lg bg-black/80 backdrop-blur-sm border ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
        {socket && (
          <span className="text-xs opacity-70">
            ID: {socket.id?.substring(0, 8)}...
          </span>
        )}
        {user && !isConnected && socket && showRetryButton && (
          <button 
            onClick={handleManualRetry}
            className="ml-2 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
          >
            Retry
          </button>
        )}
      </div>

      {/* Auto-restart notification */}
      {!isConnected && user && socket && autoRestartCountdown !== null && autoRestartAttempts < MAX_AUTO_RESTARTS && (
        <div className="fixed top-16 right-4 z-50 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <div>
              <div className="font-medium">Server connection lost</div>
              <div className="text-sm opacity-90">
                Auto-restarting in {autoRestartCountdown}s (Attempt {autoRestartAttempts + 1}/{MAX_AUTO_RESTARTS})
              </div>
            </div>
          </div>
          <button 
            onClick={handleManualRetry}
            className="mt-2 w-full bg-white text-red-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Restart Now
          </button>
        </div>
      )}

      {/* Max attempts reached notification */}
      {!isConnected && user && socket && autoRestartAttempts >= MAX_AUTO_RESTARTS && (
        <div className="fixed top-16 right-4 z-50 bg-orange-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <div>
              <div className="font-medium">Connection failed</div>
              <div className="text-sm opacity-90">
                Max auto-restart attempts reached. Please check your connection.
              </div>
            </div>
          </div>
          <button 
            onClick={handleManualRetry}
            className="mt-2 w-full bg-white text-orange-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </>
  );
};

export default ConnectionStatus;
