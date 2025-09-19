import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

const DevDebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { user, loading } = useAuth();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl+Shift+D to toggle debug panel
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        setIsVisible(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black/90 backdrop-blur-sm border border-gray-600 rounded-lg p-4 text-xs text-white max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-yellow-400">Dev Debug (Ctrl+Shift+D)</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      <div className="space-y-1">
        <div>Auth Loading: <span className={loading ? 'text-red-400' : 'text-green-400'}>{loading ? 'Yes' : 'No'}</span></div>
        <div>User: <span className={user ? 'text-green-400' : 'text-red-400'}>{user ? user.username : 'None'}</span></div>
        <div>Token: <span className={localStorage.getItem('token') ? 'text-green-400' : 'text-red-400'}>{localStorage.getItem('token') ? 'Present' : 'Missing'}</span></div>
        <div>Socket: <span className={socket ? 'text-green-400' : 'text-red-400'}>{socket ? 'Created' : 'None'}</span></div>
        <div>Connected: <span className={isConnected ? 'text-green-400' : 'text-red-400'}>{isConnected ? 'Yes' : 'No'}</span></div>
        <div>Socket ID: <span className="text-gray-400">{socket?.id || 'N/A'}</span></div>
      </div>
    </div>
  );
};

export default DevDebugPanel;
