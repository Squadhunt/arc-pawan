import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, 
  BarChart3, 
  Settings, 
  Shield, 
  Home,
  Menu,
  X,
  LogOut,
  Activity,
  MessageSquare,
  Trophy,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Posts', href: '/admin/posts', icon: MessageSquare },
    { name: 'Tournaments', href: '/admin/tournaments', icon: Trophy },
    { name: 'Feedback', href: '/admin/feedback', icon: MessageCircle },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'System Health', href: '/admin/health', icon: Activity },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0`}>
        <div className="flex items-center justify-between h-16 px-4 bg-gray-800">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-500 mr-2" />
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-8">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-800 text-white border-r-2 border-blue-500'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User info and logout */}
        <div className="absolute bottom-0 w-full p-4 bg-gray-800">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-sm font-medium">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">{user?.username}</p>
              <p className="text-gray-400 text-xs">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-40 bg-gray-900 text-white p-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
