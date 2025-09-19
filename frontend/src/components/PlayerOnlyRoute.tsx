import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PlayerOnlyRouteProps {
  children: React.ReactNode;
}

const PlayerOnlyRoute: React.FC<PlayerOnlyRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black-950 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-primary-500 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <h2 className="mt-6 text-2xl font-bold gradient-text">Loading...</h2>
          <p className="mt-2 text-gray-400">Preparing your gaming experience</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to home if user is not a player
  if (user.userType !== 'player') {
    return <Navigate to="/" replace />;
  }

  // Show protected content if user is a player
  return <>{children}</>;
};

export default PlayerOnlyRoute;
