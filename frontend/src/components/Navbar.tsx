import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import config from '../config/config';
import { 
  Home, 
  Search, 
  MessageCircle, 
  Bell,
  Trophy,
  Users,
  Loader2,
  Briefcase,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Shield,
  Rocket
} from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout, loading } = useAuth();
  const { socket } = useSocket();
  
  // Type guard function to help TypeScript understand the correct user type
  const isAdmin = (): boolean => {
    return user?.userType === 'admin';
  };
  
  const isPlayer = (): boolean => {
    return user?.userType === 'player';
  };
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
    setShowProfileMenu(false);
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showProfileMenu && !target.closest('.profile-dropdown-container')) {
        setShowProfileMenu(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showProfileMenu) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showProfileMenu]);

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/api/notifications?isRead=false`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.data.unreadCount);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    const fetchUnreadMessageCount = async () => {
      try {
        // Fetch DM unread counts
        const dmResponse = await fetch(`${config.apiUrl}/api/messages/recent`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // Fetch Groups unread counts
        const groupsResponse = await fetch(`${config.apiUrl}/api/messages/rooms`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        let totalUnread = 0;
        
        if (dmResponse.ok) {
          const dmData = await dmResponse.json();
          const dmUnread = dmData.data.conversations.reduce((sum: number, conv: any) => sum + conv.unreadCount, 0);
          totalUnread += dmUnread;
        }
        
        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json();
          const groupsUnread = groupsData.chatRooms.reduce((sum: number, group: any) => sum + group.unreadCount, 0);
          totalUnread += groupsUnread;
        }
        
        setUnreadMessageCount(totalUnread);
      } catch (error) {
        console.error('Error fetching unread message count:', error);
      }
    };

    if (user && !loading) {
      fetchUnreadCount();
      fetchUnreadMessageCount();
      const interval = setInterval(() => {
        fetchUnreadCount();
        fetchUnreadMessageCount();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, loading]);

  // Listen for message read events to update navbar count
  useEffect(() => {
    const fetchUnreadMessageCount = async () => {
      try {
        // Fetch DM unread counts
        const dmResponse = await fetch(`${config.apiUrl}/api/messages/recent`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // Fetch Groups unread counts
        const groupsResponse = await fetch(`${config.apiUrl}/api/messages/rooms`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        let totalUnread = 0;
        
        if (dmResponse.ok) {
          const dmData = await dmResponse.json();
          const dmUnread = dmData.data.conversations.reduce((sum: number, conv: any) => sum + conv.unreadCount, 0);
          totalUnread += dmUnread;
        }
        
        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json();
          const groupsUnread = groupsData.chatRooms.reduce((sum: number, group: any) => sum + group.unreadCount, 0);
          totalUnread += groupsUnread;
        }
        
        setUnreadMessageCount(totalUnread);
      } catch (error) {
        console.error('Error fetching unread message count:', error);
      }
    };

    const handleMessageRead = () => {
      fetchUnreadMessageCount();
    };

    window.addEventListener('messageRead', handleMessageRead);
    return () => {
      window.removeEventListener('messageRead', handleMessageRead);
    };
  }, []);

  // Listen for real-time message updates via socket
  useEffect(() => {
    if (socket) {
      const handleNewMessage = () => {
        // Refresh unread message count when new message arrives
        const fetchUnreadMessageCount = async () => {
          try {
            // Fetch DM unread counts
            const dmResponse = await fetch(`${config.apiUrl}/api/messages/recent`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            // Fetch Groups unread counts
            const groupsResponse = await fetch(`${config.apiUrl}/api/messages/rooms`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            let totalUnread = 0;
            
            if (dmResponse.ok) {
              const dmData = await dmResponse.json();
              const dmUnread = dmData.data.conversations.reduce((sum: number, conv: any) => sum + conv.unreadCount, 0);
              totalUnread += dmUnread;
            }
            
            if (groupsResponse.ok) {
              const groupsData = await groupsResponse.json();
              const groupsUnread = groupsData.chatRooms.reduce((sum: number, group: any) => sum + group.unreadCount, 0);
              totalUnread += groupsUnread;
            }
            
            setUnreadMessageCount(totalUnread);
          } catch (error) {
            console.error('Error fetching unread message count:', error);
          }
        };

        fetchUnreadMessageCount();
      };

      socket.on('newMessage', handleNewMessage);
      
      return () => {
        socket.off('newMessage', handleNewMessage);
      };
    }
  }, [socket]);

  // Refresh unread count when user visits notifications page
  useEffect(() => {
    if (location.pathname === '/notifications') {
      const fetchUnreadCount = async () => {
        try {
          const response = await fetch(`${config.apiUrl}/api/notifications?isRead=false`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setUnreadCount(data.data.unreadCount);
          }
        } catch (error) {
          console.error('Error fetching unread count:', error);
        }
      };
      
      // Small delay to allow the notifications page to mark as read first
      setTimeout(fetchUnreadCount, 1000);
    }
  }, [location.pathname]);

  // Refresh unread message count when user visits messages page
  useEffect(() => {
    if (location.pathname === '/messages') {
      const fetchUnreadMessageCount = async () => {
        try {
          const response = await fetch(`${config.apiUrl}/api/messages/recent`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            const totalUnread = data.data.conversations.reduce((sum: number, conv: any) => sum + conv.unreadCount, 0);
            setUnreadMessageCount(totalUnread);
          }
        } catch (error) {
          console.error('Error fetching unread message count:', error);
        }
      };
      
      // Small delay to allow the messages page to mark as read first
      setTimeout(fetchUnreadMessageCount, 1000);
    }
  }, [location.pathname]);

  // Listen for message read events to refresh unread count
  useEffect(() => {
    const handleMessageRead = () => {
      const fetchUnreadMessageCount = async () => {
        try {
          const response = await fetch(`${config.apiUrl}/api/messages/recent`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            const totalUnread = data.data.conversations.reduce((sum: number, conv: any) => sum + conv.unreadCount, 0);
            setUnreadMessageCount(totalUnread);
          }
        } catch (error) {
          console.error('Error fetching unread message count:', error);
        }
      };
      fetchUnreadMessageCount();
    };

    window.addEventListener('messageRead', handleMessageRead);
    return () => window.removeEventListener('messageRead', handleMessageRead);
  }, []);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800 shadow-lg">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo Section */}
            <div className="flex items-center space-x-4 group">
              <div className="hidden sm:block">
                <h2 className="text-2xl font-bold text-white">ARC</h2>
              </div>
            </div>

            {/* Loading indicator */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-300">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <span className="text-xs">Connecting...</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Show navbar only if user is authenticated and not admin
  if (!user) {
    return null;
  }

  // Hide navbar completely for admin users (they have admin panel sidebar)
  if (isAdmin()) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/tournaments') {
      return location.pathname === '/tournaments' || 
             location.pathname.startsWith('/tournament/') ||
             location.pathname.startsWith('/tournaments/');
    }
    return location.pathname === path;
  };

  // Hide navbar on Messages, Search, Tournaments, Profile, Connect, Recruitment, and Settings pages only on mobile
  if (location.pathname === '/messages' || location.pathname === '/search' || location.pathname === '/tournaments' || location.pathname.startsWith('/profile/') || location.pathname.startsWith('/team/') || location.pathname === '/random-connect' || location.pathname === '/recruitment' || location.pathname.startsWith('/tournament/') || location.pathname === '/settings') {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800 shadow-lg hidden md:block">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo Section */}
            <div className="flex items-center space-x-4 group">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-white ml-2">ARC</h2>
              </div>
            </div>

            {/* Desktop Navigation - Hide for admin users */}
            {!isAdmin() && (
              <div className="hidden md:flex items-center space-x-1">
              <Link 
                to="/" 
                className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-all duration-200 group ${
                  isActive('/') 
                    ? 'bg-gray-800 text-white shadow-md border border-gray-700' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Home className={`h-5 w-5 group-hover:scale-105 transition-transform duration-200 ${isActive('/') ? '' : ''}`} />
                <span className="text-xs font-semibold">Home</span>
              </Link>
              
              <Link 
                to="/search" 
                className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-all duration-200 group ${
                  isActive('/search') 
                    ? 'bg-gray-800 text-white shadow-md border border-gray-700' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Search className={`h-5 w-5 group-hover:scale-105 transition-transform duration-200 ${isActive('/search') ? '' : ''}`} />
                <span className="text-xs font-semibold">Discover</span>
              </Link>
              
              <Link 
                to="/messages"
                className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-all duration-200 group relative ${
                  isActive('/messages') 
                    ? 'bg-gray-800 text-white shadow-md border border-gray-700' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                <MessageCircle className={`h-5 w-5 group-hover:scale-105 transition-transform duration-200 ${isActive('/messages') ? '' : ''}`} />
                <span className="text-xs font-semibold">Messages</span>
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-md">
                    {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                  </span>
                )}
              </Link>
              
              <Link 
                to="/recruitment" 
                className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-all duration-200 group ${
                  isActive('/recruitment') 
                    ? 'bg-gray-800 text-white shadow-md border border-gray-700' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Briefcase className={`h-5 w-5 group-hover:scale-105 transition-transform duration-200 ${isActive('/recruitment') ? '' : ''}`} />
                <span className="text-xs font-semibold">Recruitment</span>
              </Link>
              
              <Link 
                to="/tournaments"
                className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-all duration-200 group ${
                  isActive('/tournaments') 
                    ? 'bg-gray-800 text-white shadow-md border border-gray-700' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Trophy className={`h-5 w-5 group-hover:scale-105 transition-transform duration-200 ${isActive('/tournaments') ? '' : ''}`} />
                <span className="text-xs font-semibold">Tournaments</span>
              </Link>
              
              {isPlayer() && (
                <Link 
                  to="/random-connect"
                  className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-all duration-200 group ${
                    isActive('/random-connect') 
                      ? 'bg-gray-800 text-white shadow-md border border-gray-700' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Users className={`h-5 w-5 group-hover:scale-105 transition-transform duration-200 ${isActive('/random-connect') ? '' : ''}`} />
                  <span className="text-xs font-semibold">Connect</span>
                </Link>
              )}
            </div>
            )}

            {/* Admin Navigation - Show only for admin users */}
            {isAdmin() && (
              <div className="hidden md:flex items-center space-x-1">
                <Link 
                  to="/admin" 
                  className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-all duration-200 group ${
                    isActive('/admin') 
                      ? 'bg-gray-800 text-white shadow-md border border-gray-700' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Shield className={`h-5 w-5 group-hover:scale-105 transition-transform duration-200 ${isActive('/admin') ? '' : ''}`} />
                  <span className="text-xs font-semibold">Admin Panel</span>
                </Link>
              </div>
            )}

            {/* Right Section - Notifications and Profile */}
            <div className="flex items-center space-x-6">
              <Link 
                to="/notifications" 
                className="relative p-2 text-gray-300 hover:text-white transition-colors duration-200 hover:bg-gray-800 rounded-lg"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-sm">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Profile Section */}
              <div className="relative profile-dropdown-container">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium text-xs">{user?.username || 'User'}</p>
                    <p className="text-gray-400 text-xs capitalize">{user?.userType || 'Player'}</p>
                  </div>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-700">
                      <p className="text-white font-medium">{user?.username || 'User'}</p>
                      <p className="text-gray-400 text-xs">{user?.email || 'user@example.com'}</p>
                    </div>
                    
                    <div className="py-2">
                      <Link
                        to={`/profile/${user?._id}`}
                        className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <User className="h-3 w-3 mr-3" />
                        Profile
                      </Link>
                      
                      {isAdmin() && (
                        <Link
                          to="/admin"
                          className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <Shield className="h-3 w-3 mr-3" />
                          Admin Panel
                        </Link>
                      )}
                      
                      <Link
                        to="/coming-soon"
                        className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <Rocket className="h-3 w-3 mr-3" />
                        Coming Soon
                      </Link>
                      
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <Settings className="h-3 w-3 mr-3" />
                        Settings
                      </Link>
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                      >
                        <LogOut className="h-3 w-3 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800 shadow-lg">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Logo Section */}
          <Link to="/" className="flex items-center space-x-4 group">
            <div className="ml-2">
              <h2 className="text-2xl lg:text-3xl font-bold text-white">ARC</h2>
            </div>
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center space-x-1 flex-1 justify-center">
            <Link 
              to="/" 
              className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-all duration-200 group ${
                isActive('/') 
                  ? 'bg-gray-800 text-white shadow-md border border-gray-700' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Home className={`h-5 w-5 group-hover:scale-105 transition-transform duration-200 ${isActive('/') ? '' : ''}`} />
              <span className="text-xs font-semibold">Home</span>
            </Link>
            
            <Link 
              to="/search" 
              className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-all duration-200 group ${
                isActive('/search') 
                  ? 'bg-gray-800 text-white shadow-md border border-gray-700' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Search className={`h-5 w-5 group-hover:scale-105 transition-transform duration-200 ${isActive('/search') ? '' : ''}`} />
              <span className="text-xs font-semibold">Discover</span>
            </Link>
            
                         <Link 
               to="/messages" 
               className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-all duration-200 group relative ${
                 isActive('/messages') 
                   ? 'bg-gray-800 text-white shadow-md border border-gray-700' 
                   : 'text-gray-300 hover:text-white hover:bg-gray-800'
               }`}
             >
               <MessageCircle className={`h-5 w-5 group-hover:scale-105 transition-transform duration-200 ${isActive('/messages') ? '' : ''}`} />
               <span className="text-xs font-semibold">Messages</span>
               {unreadMessageCount > 0 && (
                 <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-md">
                   {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                 </span>
               )}
             </Link>
             
             <Link 
               to="/recruitment" 
               className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-all duration-200 group ${
                 isActive('/recruitment') 
                   ? 'bg-gray-800 text-white shadow-md border border-gray-700' 
                   : 'text-gray-300 hover:text-white hover:bg-gray-800'
               }`}
             >
               <Briefcase className={`h-5 w-5 group-hover:scale-105 transition-transform duration-200 ${isActive('/recruitment') ? '' : ''}`} />
               <span className="text-xs font-semibold">Recruitment</span>
             </Link>
             
             <Link 
               to="/tournaments" 
               className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-all duration-200 group ${
                 isActive('/tournaments') 
                   ? 'bg-gray-800 text-white shadow-md border border-gray-700' 
                   : 'text-gray-300 hover:text-white hover:bg-gray-800'
               }`}
             >
               <Trophy className={`h-5 w-5 group-hover:scale-105 transition-transform duration-200 ${isActive('/tournaments') ? '' : ''}`} />
               <span className="text-xs font-semibold">Tournaments</span>
             </Link>
             
             {isPlayer() && (
               <Link 
                 to="/random-connect" 
                 className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-all duration-200 group ${
                   isActive('/random-connect') 
                     ? 'bg-gray-800 text-white shadow-md border border-gray-700' 
                     : 'text-gray-300 hover:text-white hover:bg-gray-800'
                 }`}
               >
                 <Users className={`h-5 w-5 group-hover:scale-105 transition-transform duration-200 ${isActive('/random-connect') ? '' : ''}`} />
                 <span className="text-xs font-semibold">Connect</span>
               </Link>
             )}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-6 ml-auto">
            {/* Connect - Mobile Only */}
            {isPlayer() && (
              <div className="md:hidden">
                <Link 
                  to="/random-connect" 
                  className="relative p-2 text-gray-300 hover:text-white transition-colors duration-200 hover:bg-gray-800 rounded-lg"
                >
                  <Users className="h-6 w-6" />
                </Link>
              </div>
            )}

            {/* Notifications */}
            <Link 
              to="/notifications" 
              className="relative p-2 text-gray-300 hover:text-white transition-colors duration-200 hover:bg-gray-800 rounded-lg"
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>


            {/* Profile Section - Tablet and Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="relative profile-dropdown-container">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium text-xs">{user?.username || 'User'}</p>
                    <p className="text-gray-400 text-xs capitalize">{user?.userType || 'Player'}</p>
                  </div>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-700">
                      <p className="text-white font-medium">{user?.username || 'User'}</p>
                      <p className="text-gray-400 text-xs">{user?.email || 'user@example.com'}</p>
                    </div>
                    
                    <div className="py-2">
                      <Link
                        to={`/profile/${user?._id}`}
                        className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <User className="h-3 w-3 mr-3" />
                        Profile
                      </Link>
                      
                      {isAdmin() && (
                        <Link
                          to="/admin"
                          className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <Shield className="h-3 w-3 mr-3" />
                          Admin Panel
                        </Link>
                      )}
                      
                      <Link
                        to="/coming-soon"
                        className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <Rocket className="h-3 w-3 mr-3" />
                        Coming Soon
                      </Link>
                      
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <Settings className="h-3 w-3 mr-3" />
                        Settings
                      </Link>
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                      >
                        <LogOut className="h-3 w-3 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

             {/* Mobile Messages Icon */}
             <div className="lg:hidden relative">
               <Link
                 to="/messages"
                 className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
               >
                 <MessageCircle className="h-6 w-6 text-gray-300" />
               </Link>
                {unreadMessageCount > 0 && (
                  <span className="absolute top-3.5 -right-3.5 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-sm">
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                  </span>
                )}
             </div>
          </div>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
