import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, UserPlus, Trophy, Clock } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'tournament' | 'mention' | 'achievement' | 'system';
  isRead: boolean;
  sender?: {
    _id: string;
    username: string;
    profile?: {
      avatar?: string;
      displayName?: string;
    };
  };
  data?: {
    postId?: string;
    messageId?: string;
    tournamentId?: string;
  };
  createdAt: string;
}

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'follows' | 'tournaments'>('all');

  useEffect(() => {
    fetchNotifications();
    
    // Automatically mark all notifications as read when page opens
    markAllAsReadOnPageOpen();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    if (socket) {
      socket.on('new-notification', (newNotification: Notification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      return () => {
        socket.off('new-notification');
      };
    }
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/notifications', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setNotifications(response.data.data.notifications);
      setUnreadCount(response.data.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };


  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all', {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const markAllAsReadOnPageOpen = async () => {
    try {
      await axios.put('/api/notifications/read-all', {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Update local state to reflect all notifications as read
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read on page open:', error);
    }
  };

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'follows':
        return notifications.filter(n => n.type === 'follow');
      case 'tournaments':
        return notifications.filter(n => n.type === 'tournament');
      default:
        return notifications;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-400" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-400" />;
      case 'follow':
        return <UserPlus className="h-4 w-4 text-green-400" />;
      case 'tournament':
        return <Trophy className="h-4 w-4 text-yellow-400" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'like':
        return 'bg-red-900/20 border-red-500/30';
      case 'comment':
        return 'bg-blue-900/20 border-blue-500/30';
      case 'follow':
        return 'bg-green-900/20 border-green-500/30';
      case 'tournament':
        return 'bg-yellow-900/20 border-yellow-500/30';
      default:
        return 'bg-gray-900/20 border-gray-500/30';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const filteredNotifications = getFilteredNotifications();

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded-lg mb-4 w-1/3"></div>
            <div className="h-4 bg-gray-800 rounded-lg mb-8 w-1/2"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-gray-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Notifications</h1>
            <p className="text-gray-400">Stay updated with your latest activities</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {unreadCount > 0 && (
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                {unreadCount} unread
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
          {[
            { key: 'all', label: 'All' },
            { key: 'follows', label: 'Follows' },
            { key: 'tournaments', label: 'Tournaments' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">
                  {activeTab === 'all' && 'No notifications yet'}
                  {activeTab === 'follows' && 'No follow notifications'}
                  {activeTab === 'tournaments' && 'No tournament notifications'}
                </div>
                <p className="text-gray-500">We'll notify you when something happens!</p>
              </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 rounded-lg border transition-all duration-300 ${
                  getNotificationColor(notification.type)
                } ${!notification.isRead ? 'border-purple-500/50' : ''}`}
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar/Icon */}
                  <div className="flex-shrink-0">
                    {notification.sender?.profile?.avatar ? (
                      <img
                        src={notification.sender.profile.avatar}
                        alt={notification.sender.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                        {notification.type === 'tournament' ? (
                          <Trophy className="h-5 w-5 text-yellow-400" />
                        ) : (
                          <span className="text-white font-medium">
                            {notification.sender?.username?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getNotificationIcon(notification.type)}
                      <span className="text-white font-medium">
                        {notification.title}
                      </span>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      )}
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-gray-400 text-xs">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeAgo(notification.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button - Removed since notifications auto-mark as read */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8"></div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
