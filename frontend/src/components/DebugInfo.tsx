import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

const DebugInfo: React.FC = () => {
  const { user, loading } = useAuth();
  const { socket, isConnected } = useSocket();

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black/90 backdrop-blur-sm border border-gray-600 rounded-lg p-4 text-xs text-white max-w-sm">
      <h3 className="font-bold mb-2 text-yellow-400">Debug Info</h3>
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

export default DebugInfo;
