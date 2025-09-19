import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-gray-400/30 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-gray-400 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">Loading...</h2>
          <p className="mt-2 text-gray-300">Checking admin access</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.userType !== 'admin') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-gray-300 mb-6">You don't have permission to access the admin panel.</p>
          <div className="bg-gray-800 p-4 rounded-lg mb-6 text-left">
            <p className="text-sm text-gray-300 mb-2">Debug Info:</p>
            <p className="text-xs text-gray-400">User Type: {user.userType}</p>
            <p className="text-xs text-gray-400">Username: {user.username}</p>
            <p className="text-xs text-gray-400">Required: admin</p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
