import React, { useState, useEffect } from 'react';
import { X, User, MapPin, Calendar, MessageCircle, UserPlus, UserMinus } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Follower {
  _id: string;
  username: string;
  profilePicture?: string;
  profile?: {
    displayName?: string;
    avatar?: string;
    bio?: string;
    location?: string;
  };
  userType?: 'player' | 'team' | 'admin';
  createdAt: string;
}

interface FollowersListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
  title: string;
}

const FollowersListModal: React.FC<FollowersListModalProps> = ({
  isOpen,
  onClose,
  userId,
  type,
  title
}) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingStatus, setFollowingStatus] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (isOpen && userId) {
      fetchUsers();
    }
  }, [isOpen, userId, type]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/users/${userId}/${type}`);
      const usersData = response.data.data?.[type] || [];
      setUsers(usersData);
      
      // Check following status for each user
      const statusMap: { [key: string]: boolean } = {};
      if (currentUser) {
        for (const user of usersData) {
          const userResponse = await axios.get(`/api/users/${user._id}`);
          const userData = userResponse.data.data?.user;
          if (userData && userData.followers) {
            statusMap[user._id] = userData.followers.includes(currentUser._id);
          }
        }
      }
      setFollowingStatus(statusMap);
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetUserId: string) => {
    if (!currentUser) return;

    try {
      const isCurrentlyFollowing = followingStatus[targetUserId];
      
      if (isCurrentlyFollowing) {
        await axios.delete(`/api/users/${targetUserId}/follow`);
        setFollowingStatus(prev => ({
          ...prev,
          [targetUserId]: false
        }));
      } else {
        await axios.post(`/api/users/${targetUserId}/follow`);
        setFollowingStatus(prev => ({
          ...prev,
          [targetUserId]: true
        }));
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
    }
  };

  const getDisplayName = (user: Follower) => {
    return user.profile?.displayName || user.username;
  };

  const getProfilePicture = (user: Follower) => {
    return user.profilePicture || user.profile?.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMzNzM3M0EiLz4KPHBhdGggZD0iTTIwIDEwQzIyLjIwOTEgMTAgMjQgMTEuNzkwOSAyNCAxNEMyNCAxNi4yMDkxIDIyLjIwOTEgMTggMjAgMThDMTcuNzkwOSAxOCAxNiAxNi4yMDkxIDE2IDE0QzE2IDExLjc5MDkgMTYuNzkwOSAxMCAyMCAxMFoiIGZpbGw9IiM2QjZCNkIiLz4KPHBhdGggZD0iTTI4IDMwQzI4IDI2LjY4NjMgMjQuNDE4MyAyNCAyMCAyNEMxNS41ODE3IDI0IDEyIDI2LjY4NjMgMTIgMzBIMjhaIiBmaWxsPSIjNkI2QjZCIi8+Cjwvc3ZnPgo=';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : users.length > 0 ? (
            <div className="p-4 sm:p-6 space-y-3">
              {users.map((user) => (
                <div key={user._id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="relative flex-shrink-0">
                    <img
                      src={getProfilePicture(user)}
                      alt={getDisplayName(user)}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                        {getDisplayName(user)}
                      </h3>
                      {user.userType === 'team' && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                          Team
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      <span>@{user.username}</span>
                      {user.profile?.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{user.profile.location}</span>
                        </div>
                      )}
                    </div>
                    
                    {user.profile?.bio && (
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                        {user.profile.bio}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="h-3 w-3" />
                      <span>Joined {formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                  
                  {currentUser && currentUser._id !== user._id && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleFollow(user._id)}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                          followingStatus[user._id]
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {followingStatus[user._id] ? (
                          <>
                            <UserMinus className="h-3 w-3" />
                            <span className="hidden sm:inline">Following</span>
                            <span className="sm:hidden">✓</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-3 w-3" />
                            <span className="hidden sm:inline">Follow</span>
                            <span className="sm:hidden">+</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => window.location.href = `/messages?user=${user._id}`}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Send message"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 px-4 sm:px-6">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No {type} yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center text-sm">
                {type === 'followers' 
                  ? 'This user doesn\'t have any followers yet.'
                  : 'This user isn\'t following anyone yet.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowersListModal;
