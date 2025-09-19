import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Search as SearchIcon, Users, Filter, X, Crown, Star, MapPin, Calendar, Home, MessageCircle, User, Plus, Trophy, Briefcase } from 'lucide-react';
import CreatePostModal from '../components/CreatePostModal';
import MobileBottomNav from '../components/MobileBottomNav';
import axios from 'axios';

interface User {
  _id: string;
  username: string;
  email: string;
  profilePicture?: string;
  role?: 'player' | 'team';
  userType?: 'player' | 'team' | 'admin';
  profile?: {
    displayName?: string;
    avatar?: string;
    banner?: string;
    bio?: string;
    location?: string;
    dateOfBirth?: string;
    gamingPreferences?: string[];
    achievements?: string[];
    socialLinks?: {
      discord?: string;
      steam?: string;
      twitch?: string;
    };
  };
  followers?: string[];
  following?: string[];
  createdAt: string;
}



const Search: React.FC = () => {
  const { user: currentUser } = useAuth();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    role: '',
    location: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        performSearch();
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, filters]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // Search for users only - as requested by user
      const userResponse = await axios.get(`/api/users?search=${encodeURIComponent(searchQuery)}`);
      setSearchResults(userResponse.data.data?.users || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      await axios.post(`/api/users/${userId}/follow`);
      // Update the user in search results to show they're now followed
      setSearchResults(prev => prev.map(user => {
        if (user._id === userId) {
          return {
            ...user,
            followers: [...(user.followers || []), currentUser?._id || '']
          };
        }
        return user;
      }));
    } catch (error) {
      console.error('Follow error:', error);
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      await axios.delete(`/api/users/${userId}/follow`);
      // Update the user in search results to show they're now unfollowed
      setSearchResults(prev => prev.map(user => {
        if (user._id === userId) {
          return {
            ...user,
            followers: (user.followers || []).filter(id => id !== currentUser?._id)
          };
        }
        return user;
      }));
    } catch (error) {
      console.error('Unfollow error:', error);
    }
  };

  const isFollowing = (targetUser: User) => {
    return targetUser.followers?.includes(currentUser?._id || '') || false;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDisplayName = (user: User) => {
    return user.profile?.displayName || user.username;
  };

  const getProfilePicture = (user: User) => {
    return user.profilePicture || user.profile?.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMzNzM3M0EiLz4KPHBhdGggZD0iTTIwIDEwQzIyLjIwOTEgMTAgMjQgMTEuNzkwOSAyNCAxNEMyNCAxNi4yMDkxIDIyLjIwOTEgMTggMjAgMThDMTcuNzkwOSAxOCAxNiAxNi4yMDkxIDE2IDE0QzE2IDExLjc5MDkgMTcuNzkwOSAxMCAyMCAxMFoiIGZpbGw9IiM2QjZCNkIiLz4KPHBhdGggZD0iTTI4IDMwQzI4IDI2LjY4NjMgMjQuNDE4MyAyNCAyMCAyNEMxNS41ODE3IDI0IDEyIDI2LjY4NjMgMTIgMzBIMjhaIiBmaWxsPSIjNkI2QjZCIi8+Cjwvc3ZnPgo=';
  };

  return (
    <div className="min-h-screen bg-black lg:pt-24 pb-20 lg:pb-6 h-screen lg:h-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2 lg:py-6 h-full flex flex-col">
        {/* Search Header */}
        <div className="mb-3 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 lg:mb-2">Discover</h1>
          <p className="text-sm lg:text-base text-gray-400">Find players, teams, and gaming content</p>
          
          {/* Mobile Quick Actions */}
          <div className="lg:hidden mt-2 flex flex-wrap gap-2">
            <button 
              onClick={() => setSearchQuery('players')}
              className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-full text-xs hover:bg-gray-700 transition-colors"
            >
              #Players
            </button>
            <button 
              onClick={() => setSearchQuery('teams')}
              className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-full text-xs hover:bg-gray-700 transition-colors"
            >
              #Teams
            </button>
            <button 
              onClick={() => setSearchQuery('bgmi')}
              className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-full text-xs hover:bg-gray-700 transition-colors"
            >
              #BGMI
            </button>
            <button 
              onClick={() => setSearchQuery('valorant')}
              className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-full text-xs hover:bg-gray-700 transition-colors"
            >
              #Valorant
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="card mb-3 lg:mb-6">
          <div className="flex items-center space-x-2 lg:space-x-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for players, teams..."
                className="input-field w-full px-3 lg:px-4 py-2.5 lg:py-3 text-sm lg:text-base"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center p-2.5 lg:p-3 rounded-lg transition-all duration-200 min-w-[44px] h-[44px] lg:min-w-[48px] lg:h-[48px] ${
                showFilters 
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Filter className="h-4 w-4 lg:h-5 lg:w-5" />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <select
                  value={filters.role}
                  onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                  className="input-field py-2 lg:py-2.5 text-sm lg:text-base"
                >
                  <option value="">All Roles</option>
                  <option value="player">Players</option>
                  <option value="team">Teams</option>
                </select>
                
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Location..."
                  className="input-field py-2 lg:py-2.5 text-sm lg:text-base"
                />
              </div>
            </div>
          )}
        </div>



        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Searching...</p>
          </div>
        )}

        {/* Search Results */}
        {!loading && searchQuery && (
          <div className="space-y-3 lg:space-y-4">
            {searchResults.length > 0 ? (
              searchResults.map((user) => (
                <div key={user._id} className="card">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex items-center space-x-3 lg:space-x-4">
                      <img
                        src={getProfilePicture(user)}
                        alt={getDisplayName(user)}
                        className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg object-cover border-2 border-gray-700 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-white text-sm lg:text-base truncate">{getDisplayName(user)}</h3>
                          {user.role === 'team' && <Crown className="h-3 w-3 lg:h-4 lg:w-4 text-blue-400 flex-shrink-0" />}
                        </div>
                        <p className="text-xs lg:text-sm text-gray-400 capitalize">{user.role || user.userType}</p>
                        {user.profile?.bio && (
                          <p className="text-xs lg:text-sm text-gray-300 mt-1 line-clamp-2">{user.profile.bio}</p>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 mt-2 text-xs text-gray-400">
                          {user.profile?.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{user.profile.location}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span>Joined {formatDate(user.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between lg:justify-end space-x-3">
                      <div className="text-center">
                        <div className="font-bold text-white text-sm lg:text-base">{user.followers?.length || 0}</div>
                        <div className="text-xs text-gray-400">Followers</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {user._id !== currentUser?._id && (
                          <button
                            onClick={() => isFollowing(user) ? handleUnfollow(user._id) : handleFollow(user._id)}
                            className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg font-medium transition-colors text-xs lg:text-sm ${
                              isFollowing(user)
                                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'
                            }`}
                          >
                            {isFollowing(user) ? 'Unfollow' : 'Follow'}
                          </button>
                        )}
                        <Link
                          to={`/profile/${user._id}`}
                          className="px-3 lg:px-4 py-1.5 lg:py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs lg:text-sm"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="card text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No users found</h3>
                <p className="text-gray-400">Try adjusting your search terms or filters</p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !searchQuery && (
          <div className="card text-center py-8 lg:py-16 flex-grow flex flex-col justify-center">
            <div className="mb-6 lg:mb-8">
              <div className="relative mb-4 lg:mb-6">
                <SearchIcon className="h-16 w-16 lg:h-20 lg:w-20 text-gray-400 mx-auto opacity-60" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3 lg:mb-4">Start Discovering</h2>
              <p className="text-gray-400 text-sm lg:text-lg max-w-md mx-auto px-4">
                Search for players, teams, or gaming content to connect with the community
              </p>
            </div>
            
            {/* Mobile Quick Search Suggestions */}
            <div className="lg:hidden mb-6">
              <p className="text-gray-500 text-xs mb-3">Try searching for:</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button 
                  onClick={() => setSearchQuery('pro players')}
                  className="px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-full text-xs hover:bg-blue-600/30 transition-colors"
                >
                  Pro Players
                </button>
                <button 
                  onClick={() => setSearchQuery('esports teams')}
                  className="px-3 py-1.5 bg-purple-600/20 text-purple-400 rounded-full text-xs hover:bg-purple-600/30 transition-colors"
                >
                  Esports Teams
                </button>
                <button 
                  onClick={() => setSearchQuery('gaming content')}
                  className="px-3 py-1.5 bg-green-600/20 text-green-400 rounded-full text-xs hover:bg-green-600/30 transition-colors"
                >
                  Gaming Content
                </button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-4 lg:gap-6">
              <div className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer group">
                <div className="p-2 rounded-lg bg-gray-800 group-hover:bg-gray-700 transition-colors duration-200">
                  <Users className="h-4 w-4 lg:h-5 lg:w-5" />
                </div>
                <span className="font-medium text-sm lg:text-base">Find Players</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer group">
                <div className="p-2 rounded-lg bg-gray-800 group-hover:bg-gray-700 transition-colors duration-200">
                  <Crown className="h-4 w-4 lg:h-5 lg:w-5" />
                </div>
                <span className="font-medium text-sm lg:text-base">Join Teams</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer group">
                <div className="p-2 rounded-lg bg-gray-800 group-hover:bg-gray-700 transition-colors duration-200">
                  <Star className="h-4 w-4 lg:h-5 lg:w-5" />
                </div>
                <span className="font-medium text-sm lg:text-base">Discover Content</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
        onPostCreated={() => {
          setIsCreatePostModalOpen(false);
        }}
      />
    </div>
  );
};

export default Search;
