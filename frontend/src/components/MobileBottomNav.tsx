import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Search, 
  Briefcase, 
  Trophy, 
  ChevronUp,
  User,
  Settings,
  LogOut,
  Rocket
} from 'lucide-react';

const MobileBottomNav: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Close dropdown when location changes
  useEffect(() => {
    setShowMoreMenu(false);
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showMoreMenu && !target.closest('.more-dropdown-container')) {
        setShowMoreMenu(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showMoreMenu) {
        setShowMoreMenu(false);
      }
    };

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showMoreMenu]);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 mobile-bottom-nav">
      <div className="flex items-center justify-around py-2">
        <Link
          to="/"
          className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-all duration-200 min-w-[60px] ${
            location.pathname === '/' 
              ? 'text-white bg-blue-600' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs font-medium">Home</span>
        </Link>
        
        <Link
          to="/search"
          className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-all duration-200 min-w-[60px] ${
            location.pathname === '/search' 
              ? 'text-white bg-blue-600' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Search className="h-5 w-5" />
          <span className="text-xs font-medium">Discover</span>
        </Link>
        
        <Link
          to="/recruitment"
          className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-all duration-200 min-w-[60px] ${
            location.pathname === '/recruitment' 
              ? 'text-white bg-blue-600' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Briefcase className="h-5 w-5" />
          <span className="text-xs font-medium">Recruitment</span>
        </Link>
        
        <Link
          to="/tournaments"
          className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-all duration-200 min-w-[60px] ${
            location.pathname === '/tournaments' 
              ? 'text-white bg-blue-600' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Trophy className="h-5 w-5" />
          <span className="text-xs font-medium">Tournaments</span>
        </Link>
        
        {/* More Dropdown */}
        <div className="relative more-dropdown-container">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-all duration-200 min-w-[60px] ${
              showMoreMenu 
                ? 'text-white bg-blue-600' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ChevronUp className="h-5 w-5" />
            <span className="text-xs font-medium">More</span>
          </button>

          {/* More Dropdown Menu */}
          {showMoreMenu && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 z-50">
              <div className="py-2">
                <Link
                  to={`/profile/${user?._id}`}
                  className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                  onClick={() => setShowMoreMenu(false)}
                >
                  <User className="h-4 w-4 mr-3" />
                  Profile
                </Link>
                
                <Link
                  to="/coming-soon"
                  className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                  onClick={() => setShowMoreMenu(false)}
                >
                  <Rocket className="h-4 w-4 mr-3" />
                  Coming Soon
                </Link>
                
                <Link
                  to="/settings"
                  className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                  onClick={() => setShowMoreMenu(false)}
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Settings
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileBottomNav;
