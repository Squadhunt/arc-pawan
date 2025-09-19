import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  MapPin, 
  Calendar, 
  Mail, 
  Gamepad2, 
  Trophy, 
  Users, 
  Settings, 
  Edit, 
  Plus, 
  MessageCircle, 
  Crown,
  Star,
  Award,
  Target,
  Flame,
  Zap,
  Clock,
  Trash2,
  Home,
  Search,
  Briefcase
} from 'lucide-react';
import MobileBottomNav from '../components/MobileBottomNav';
import axios from 'axios';
import LeaveRequestModal from '../components/LeaveRequestModal';
import GamingStatsModal from '../components/GamingStatsModal';
import FollowersListModal from '../components/FollowersListModal';
import OptimizedImage from '../components/OptimizedImage';
import PostCard from '../components/PostCard';

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
    socialLinks?: {
      discord?: string;
      steam?: string;
      twitch?: string;
    };
  };
  playerInfo?: {
    games?: Array<{
      name: string;
      rank: string;
      experience: string;
    }>;
    achievements?: Array<{
      title: string;
      description: string;
      date: string;
    }>;
    lookingForTeam?: boolean;
    preferredRoles?: string[];
    skillLevel?: string;
    gamingStats?: Array<{
      _id?: string;
      game: string;
      // BGMI fields
      characterId?: string;
      inGameName?: string;
      idLevel?: number;
      role?: string;
      fdRatio?: number;
      currentTier?: string;
      // Clash of Clans fields
      playerTag?: string;
      townhallLevel?: string;
      // Clash Royale fields
      arena?: string;
      // Chess.com fields
      username?: string;
      rating?: number;
      title?: string;
      puzzleRating?: number;
      // Fortnite fields
      epicUsername?: string;
      level?: number;
      wins?: number;
      kd?: number;
      playstyle?: string;
      // Valorant fields
      tag?: string;
      rank?: string;
      rr?: number;
      peakRank?: string;
      // Call of Duty Mobile fields
      uid?: string;
      // Free Fire Max fields
      // PUBG Mobile fields
      // Rocket League fields
      platform?: string;
      mmr?: number;
      // Common fields
    }>;
    joinedTeams?: Array<{
      team: {
        _id: string;
        username: string;
        profile?: {
          displayName?: string;
          avatar?: string;
        };
      };
      game: string;
      role: string;
      inGameName?: string;
      joinedAt: string;
      leftAt?: string;
      isActive: boolean;
      leaveRequestStatus?: 'none' | 'pending' | 'approved' | 'rejected';
    }>;
  };
  followers?: string[];
  following?: string[];
  createdAt: string;
}

interface Post {
  _id: string;
  content: {
    text: string;
    media?: Array<{
      type: 'image' | 'video';
      url: string;
      publicId: string;
    }>;
  };
  author: {
    _id: string;
    username: string;
    profilePicture?: string;
    profile?: {
      displayName?: string;
      avatar?: string;
    };
  };
  likes: Array<{
    user: string;
    likedAt: string;
  }>;
  comments: Array<{
    user: {
      _id: string;
      username: string;
      profilePicture?: string;
      profile?: {
        displayName?: string;
        avatar?: string;
      };
    };
    text: string;
    createdAt: string;
  }>;
  createdAt: string;
  tags?: string[];
}

const Profile: React.FC = () => {
  const { id: userId } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
     const [activeTab, setActiveTab] = useState<'posts' | 'teams' | 'gaming'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [leavingTeam, setLeavingTeam] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showLeaveRequestModal, setShowLeaveRequestModal] = useState(false);
  const [selectedTeamForLeave, setSelectedTeamForLeave] = useState<{ id: string; name: string } | null>(null);
  const [showGamingStatsModal, setShowGamingStatsModal] = useState(false);
  const [editingGamingStat, setEditingGamingStat] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  // Use current user's ID if no userId is provided (when accessing /profile directly)
  const targetUserId = userId || currentUser?._id;
  const isOwnProfile = currentUser?._id === targetUserId;

  useEffect(() => {
    if (targetUserId) {
      fetchUserProfile();
      fetchUserPosts();
    }
  }, [targetUserId]);


  const fetchUserProfile = async () => {
    try {
      console.log('Fetching user profile for:', targetUserId);
      
      // Add cache-busting parameter to ensure fresh data
      const response = await axios.get(`/api/users/${targetUserId}?t=${Date.now()}`);
      const userData = response.data.data?.user;
      
      console.log('User data received:', userData);
      console.log('Joined teams data:', userData?.playerInfo?.joinedTeams);
      
      if (!userData) {
        console.error('No user data found in response');
        setLoading(false);
        return;
      }
      
      // If this is a team profile, redirect to team profile page
      if (userData.userType === 'team' || userData.role === 'team') {
        navigate(`/team/${userId}`);
        return;
      }
      
      console.log('Setting user data:', userData);
      setUser(userData);
      
      // Check if current user is following this user
      if (currentUser && userData.followers) {
        setIsFollowing(userData.followers.includes(currentUser._id));
      }
      
      setFollowersCount(userData.followers?.length || 0);
      setFollowingCount(userData.following?.length || 0);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      console.log('Fetching posts for user:', targetUserId);
      const response = await axios.get(`/api/users/${targetUserId}/posts`);
      console.log('Posts response:', response.data);
      setPosts(response.data.data?.posts || []);
    } catch (error: any) {
      console.error('Error fetching user posts:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  const refreshPosts = () => {
    fetchUserPosts();
  };

  const handleFollow = async () => {
    if (!currentUser) return;

    try {
      if (isFollowing) {
        console.log('Unfollowing user:', targetUserId);
        const response = await axios.delete(`/api/users/${targetUserId}/follow`);
        console.log('Unfollow response:', response.data);
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
      } else {
        console.log('Following user:', targetUserId);
        const response = await axios.post(`/api/users/${targetUserId}/follow`);
        console.log('Follow response:', response.data);
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Error following/unfollowing:', error);
      console.error('Error details:', error.response?.data);
    }
  };



  const handleLeaveTeam = async (teamId: string, game: string) => {
    if (game === 'Staff') {
      // For staff members, show leave request modal
      const teamRef = user?.playerInfo?.joinedTeams?.find(t => t.team._id === teamId);
      if (teamRef) {
        setSelectedTeamForLeave({
          id: teamId,
          name: teamRef.team.profile?.displayName || teamRef.team.username
        });
        setShowLeaveRequestModal(true);
      }
      return;
    }

    // For roster players, use the old direct leave system
    if (!window.confirm('Are you sure you want to leave this team?')) {
      return;
    }

    try {
      setLeavingTeam(teamId);
      console.log('Leaving team:', { teamId, game });
      
      const response = await axios.delete(`/api/users/${teamId}/roster/${game}/leave`);
      
      console.log('Leave team response:', response.data);
      console.log('Team left successfully, refreshing user data...');
      
      // Force a complete refresh of the user data
      setLoading(true);
      await fetchUserProfile();
      
      console.log('User data refreshed');
      
      // Show success message
      setMessage({ type: 'success', text: 'Successfully left the team!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error leaving team:', error);
      console.error('Error response:', error.response?.data);
      setMessage({ 
        type: 'error', 
        text: `Failed to leave team: ${error.response?.data?.message || error.message}` 
      });
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLeavingTeam(null);
    }
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDisplayName = (user: User) => {
    return user.profile?.displayName || user.username;
  };

  const getProfilePicture = (user: User) => {
    return user.profilePicture || user.profile?.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNjAiIHI9IjYwIiBmaWxsPSIjMzczNzNBIi8+CjxwYXRoIGQ9Ik02MCAzMEM2Ni4yNzQxIDMwIDcxLjQgMzUuMTI1OSA3MS40IDQxLjRDNzEuNCA0Ny42NzQxIDY2LjI3NDEgNTIuOCA2MCA1Mi44QzUzLjcyNTkgNTIuOCA0OC42IDQ3LjY3NDEgNDguNiA0MS40QzQ4LjYgMzUuMTI1OSA1My43MjU5IDMwIDYwIDMwWiIgZmlsbD0iIzZCNkI2QiIvPgo8cGF0aCBkPSJNODQgOTBDODQgNzguOTU0MyA3My4wNDU3IDY4IDYwIDY4QzQ2Ljk1NDMgNjggMzYgNzguOTU0MyAzNiA5MEg4NFoiIGZpbGw9IiM2QjZCNkIiLz4KPC9zdmc+Cg==';
  };

  const getTeamProfilePicture = (team: any) => {
    return team.profile?.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNjAiIHI9IjYwIiBmaWxsPSIjMzczNzNBIi8+CjxwYXRoIGQ9Ik02MCAzMEM2Ni4yNzQxIDMwIDcxLjQgMzUuMTI1OSA3MS40IDQxLjRDNzEuNCA0Ny42NzQxIDY2LjI3NDEgNTIuOCA2MCA1Mi44QzUzLjcyNTkgNTIuOCA0OC42IDQ3LjY3NDEgNDguNiA0MS40QzQ4LjYgMzUuMTI1OSA1My43MjU5IDMwIDYwIDMwWiIgZmlsbD0iIzZCNkI2QiIvPgo8cGF0aCBkPSJNODQgOTBDODQgNzguOTU0MyA3My4wNDU3IDY4IDYwIDY4QzQ2Ljk1NDMgNjggMzYgNzguOTU0MyAzNiA5MEg4NFoiIGZpbGw9IiM2QjZCNkIiLz4KPC9zdmc+Cg==';
  };

  const handleEditGamingStat = (stat: any) => {
    setEditingGamingStat(stat);
    setShowGamingStatsModal(true);
  };

  const handleDeleteGamingStat = async (statId: string | number) => {
    if (!currentUser || !user) return;
    
    try {
      const response = await axios.delete(`/api/users/gaming-stats/${statId}`);
      
      if (response.data.success) {
        // Refresh user data to get updated gaming stats
        await fetchUserProfile();
        
        setMessage({ type: 'success', text: 'Gaming stat deleted successfully!' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error deleting gaming stat:', error);
      setMessage({ type: 'error', text: 'Failed to delete gaming stat' });
      setTimeout(() => setMessage(null), 3000);
    }
  };


  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    
    try {
      await axios.delete(`/api/posts/${postToDelete}`);
      setPosts(posts.filter(post => post._id !== postToDelete));
      setMessage({ type: 'success', text: 'Post deleted successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting post:', error);
      setMessage({ type: 'error', text: 'Failed to delete post' });
      setTimeout(() => setMessage(null), 3000);
    }
    
    setShowDeleteModal(false);
    setPostToDelete(null);
  };

  const handleSaveGamingStat = async (stat: any) => {
    if (!user) return;
    
    try {
      let response;
      
      if (editingGamingStat) {
        // Update existing stat
        response = await axios.put(`/api/users/gaming-stats/${editingGamingStat._id}`, stat);
      } else {
        // Add new stat
        response = await axios.post('/api/users/gaming-stats', stat);
      }
      
      if (response.data.success) {
        // Refresh user data to get updated gaming stats
        await fetchUserProfile();
        
        setMessage({ type: 'success', text: 'Gaming stats saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
        setEditingGamingStat(null);
      }
    } catch (error) {
      console.error('Error saving gaming stat:', error);
      setMessage({ type: 'error', text: 'Failed to save gaming stats' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-800 rounded-lg mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="h-12 bg-gray-800 rounded-lg mb-4"></div>
                <div className="space-y-4">
                  <div className="h-32 bg-gray-800 rounded-lg"></div>
                  <div className="h-32 bg-gray-800 rounded-lg"></div>
                </div>
              </div>
              <div className="h-64 bg-gray-800 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black pt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Profile Not Found</h1>
            <p className="text-gray-400">The user you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-0 lg:pt-24 pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border-2 ${
            message.type === 'success' 
              ? 'bg-green-900/20 text-green-300 border-green-500/50' 
              : 'bg-red-900/20 text-red-300 border-red-500/50'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">{message.text}</span>
              <button 
                onClick={() => setMessage(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        )}
        
        {/* Enhanced Profile Header */}
        <div className="relative mb-12 overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-indigo-900/20 rounded-2xl"></div>
          
          {/* Profile Card */}
          <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
              {/* Avatar Section */}
              <div className="relative group mx-auto lg:mx-0">
               <div className="relative">
                 <img
                   src={getProfilePicture(user)}
                   alt={getDisplayName(user)}
                    className="w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-2xl object-cover border-4 border-blue-500/40 shadow-2xl group-hover:shadow-blue-500/25 transition-all duration-500"
                 />
             </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              {/* Profile Info */}
              <div className="flex-1 w-full text-center lg:text-left">
                <div className="flex flex-col lg:flex-row lg:items-start space-y-3 lg:space-y-0 lg:space-x-4 mb-4">
                  <div className="flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-3">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                      {getDisplayName(user)}
                    </h1>
                    {user.userType === 'team' && (
                      <div className="flex items-center space-x-2">
                        <Crown className="h-6 w-6 text-yellow-400" />
                        <span className="text-yellow-400 font-semibold text-sm">Team</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-4 mb-4">
                  <span className="inline-block px-4 py-2 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-full text-sm font-medium">
                    {user.userType || user.role}
                  </span>
                {user.profile?.location && (
                    <div className="flex items-center justify-center lg:justify-start space-x-2 text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{user.profile.location}</span>
                  </div>
                )}
                  <div className="flex items-center justify-center lg:justify-start space-x-2 text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Joined {formatDate(user.createdAt)}</span>
                </div>
              </div>
              
                {user.profile?.bio && (
                  <p className="text-gray-300 mb-6 text-base lg:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0">
                    {user.profile.bio}
                  </p>
                )}
                
                {/* Stats Section */}
                <div className="flex items-center justify-center lg:justify-start space-x-8 mb-6">
                <div 
                  className="text-center group cursor-pointer hover:scale-110 transition-all duration-300"
                  onClick={() => setShowFollowersModal(true)}
                >
                    <div className="font-bold text-2xl lg:text-3xl text-blue-400 group-hover:text-blue-300 transition-colors">
                      {followersCount}
                    </div>
                    <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors font-medium">
                      Followers
                    </div>
                </div>
                <div 
                  className="text-center group cursor-pointer hover:scale-110 transition-all duration-300"
                  onClick={() => setShowFollowingModal(true)}
                >
                    <div className="font-bold text-2xl lg:text-3xl text-blue-400 group-hover:text-blue-300 transition-colors">
                      {followingCount}
                    </div>
                    <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors font-medium">
                      Following
                    </div>
                </div>
                <div className="text-center group cursor-pointer hover:scale-110 transition-all duration-300">
                    <div className="font-bold text-2xl lg:text-3xl text-blue-400 group-hover:text-blue-300 transition-colors">
                      {posts.length}
                    </div>
                    <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors font-medium">
                      Posts
                    </div>
                </div>
              </div>
            </div>
            
              {/* Action Buttons */}
              <div className="flex flex-row lg:flex-col space-x-3 lg:space-x-0 lg:space-y-3 w-full lg:w-auto">
              {isOwnProfile ? (
                <>
                  <Link
                    to="/edit-profile"
                      className="flex-1 lg:flex-none bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                      <Edit className="h-5 w-5" />
                    <span className="hidden sm:inline">Edit Profile</span>
                    <span className="sm:hidden">Edit</span>
                  </Link>
                  <Link
                    to="/settings"
                      className="flex-1 lg:flex-none bg-gray-800/80 hover:bg-gray-700/80 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 border border-gray-600 hover:border-gray-500"
                  >
                      <Settings className="h-5 w-5" />
                    <span className="hidden sm:inline">Settings</span>
                    <span className="sm:hidden">Settings</span>
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                      className={`flex-1 lg:flex-none px-6 py-3 rounded-xl font-semibold transition-all duration-200 text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 ${
                      isFollowing
                          ? 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 border border-gray-600'
                          : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                    }`}
                  >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                  <Link
                    to={`/messages?user=${targetUserId}`}
                      className="flex-1 lg:flex-none bg-gray-800/80 hover:bg-gray-700/80 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 border border-gray-600 hover:border-gray-500"
                  >
                      <MessageCircle className="h-5 w-5" />
                    <span className="hidden sm:inline">Message</span>
                    <span className="sm:hidden">Msg</span>
                  </Link>
                </>
              )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Navigation Tabs */}
        <div className="mb-6 sm:mb-10">
          <div className="flex overflow-x-auto space-x-1 sm:space-x-2 pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab('posts')}
              className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-200 whitespace-nowrap transform hover:scale-105 ${
              activeTab === 'posts'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50 border border-gray-700 hover:border-gray-600'
            }`}
          >
              <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm md:text-base">Posts</span>
            {posts.length > 0 && (
                <span className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                  activeTab === 'posts' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-blue-600/20 text-blue-400'
                }`}>
                {posts.length}
              </span>
            )}
          </button>
          {user?.userType === 'player' && (
            <button
              onClick={() => setActiveTab('teams')}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-200 whitespace-nowrap transform hover:scale-105 ${
                activeTab === 'teams'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50 border border-gray-700 hover:border-gray-600'
              }`}
            >
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm md:text-base">Teams</span>
              {user.playerInfo?.joinedTeams && user.playerInfo.joinedTeams.filter(teamRef => !teamRef.team.username.startsWith('duo_')).length > 0 && (
                  <span className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                    activeTab === 'teams' 
                      ? 'bg-white/20 text-white' 
                      : 'bg-blue-600/20 text-blue-400'
                  }`}>
                  {user.playerInfo.joinedTeams.filter(teamRef => !teamRef.team.username.startsWith('duo_')).length}
                </span>
              )}
            </button>
          )}
          {user?.userType === 'player' && (
            <button
              onClick={() => setActiveTab('gaming')}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-200 whitespace-nowrap transform hover:scale-105 ${
                activeTab === 'gaming'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50 border border-gray-700 hover:border-gray-600'
              }`}
            >
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm md:text-base">Gaming</span>
            </button>
          )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8">
          {/* Main Content */}
          <div className="space-y-6">
            {activeTab === 'posts' && (
              <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard 
                      key={post._id} 
                      post={post} 
                      onUpdate={refreshPosts}
                    />
                  ))
                ) : (
                  <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Gamepad2 className="h-10 w-10 text-gray-400" />
                     </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">No posts yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                       {isOwnProfile ? 'Start sharing your gaming experiences and connect with other players!' : 'This user hasn\'t posted anything yet.'}
                     </p>
                     {isOwnProfile && (
                      <Link to="/create-post" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2 mx-auto w-fit">
                         <Plus className="h-5 w-5" />
                         <span>Create Your First Post</span>
                       </Link>
                     )}
                   </div>
                )}
              </div>
            )}


            {activeTab === 'teams' && (
              <div className="card">
                <h3 className="text-xl font-bold text-white mb-4">Team History</h3>
                
                                 {user.playerInfo?.joinedTeams && user.playerInfo.joinedTeams.filter(teamRef => !teamRef.team.username.startsWith('duo_')).length > 0 ? (
                   <div className="space-y-4">
                     {user.playerInfo.joinedTeams
                       .filter(teamRef => !teamRef.team.username.startsWith('duo_'))
                       .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
                       .map((teamRef, index) => (
                      <div key={index} className={`bg-gray-900 rounded-lg p-6 border-2 shadow-lg hover:shadow-xl transition-all duration-200 ${
                        teamRef.isActive 
                          ? 'border-blue-500/50 shadow-blue-500/20' 
                          : 'border-gray-700'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <img
                                src={teamRef.team.profile?.avatar || getTeamProfilePicture(teamRef.team)}
                                alt={teamRef.team.profile?.displayName || teamRef.team.username}
                                className="w-16 h-16 rounded-lg object-cover border-2 border-gray-700 shadow-lg"
                              />
                              {teamRef.isActive && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-white text-lg flex items-center space-x-2">
                                <span>{teamRef.team.profile?.displayName || teamRef.team.username}</span>
                                {teamRef.isActive ? (
                                  <span className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-medium">Active</span>
                                ) : (
                                  <span className="px-2 py-1 bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-lg text-xs font-medium">Left</span>
                                )}
                                {teamRef.game === 'Staff' && teamRef.leaveRequestStatus && teamRef.leaveRequestStatus !== 'none' && (
                                  <span className={`px-2 py-1 border rounded-lg text-xs font-medium flex items-center space-x-1 ${
                                    teamRef.leaveRequestStatus === 'pending' 
                                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
                                      : teamRef.leaveRequestStatus === 'approved'
                                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                                  }`}>
                                    <Clock className="h-3 w-3" />
                                    <span className="capitalize">{teamRef.leaveRequestStatus}</span>
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-400">
                                @{teamRef.team.username}
                              </div>
                            </div>
                          </div>
                                                     {teamRef.isActive && isOwnProfile && (
                             <button
                               onClick={() => {
                                 console.log('Leave team clicked:', { teamId: teamRef.team._id, game: teamRef.game, teamRef });
                                 handleLeaveTeam(teamRef.team._id, teamRef.game);
                               }}
                               disabled={leavingTeam === teamRef.team._id}
                               className={`px-4 py-2 border rounded-lg transition-colors font-medium ${
                                 leavingTeam === teamRef.team._id
                                   ? 'bg-red-500/10 text-red-300 border-red-500/20 cursor-not-allowed'
                                   : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                               }`}
                             >
                               {leavingTeam === teamRef.team._id ? 'Leaving...' : 'Leave Team'}
                             </button>
                           )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-secondary-700/50 rounded-lg p-3">
                            <div className="text-xs text-secondary-400 mb-1">Game</div>
                            <div className="text-white font-medium">{teamRef.game}</div>
                          </div>
                          <div className="bg-secondary-700/50 rounded-lg p-3">
                            <div className="text-xs text-secondary-400 mb-1">Role</div>
                            <div className="text-white font-medium">{teamRef.role}</div>
                          </div>
                          {teamRef.inGameName && (
                            <div className="bg-secondary-700/50 rounded-lg p-3">
                              <div className="text-xs text-secondary-400 mb-1">In-Game Name</div>
                              <div className="text-white font-medium">{teamRef.inGameName}</div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-secondary-400 mb-4">
                          <div>
                            <span className="font-medium">Joined:</span> {formatDate(teamRef.joinedAt)}
                          </div>
                          {teamRef.leftAt && (
                            <div>
                              <span className="font-medium">Left:</span> {formatDate(teamRef.leftAt)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <Link
                            to={`/profile/${teamRef.team.username}`}
                            className="inline-flex items-center space-x-2 bg-primary-500/20 text-primary-400 border border-primary-500/30 px-4 py-2 rounded-lg hover:bg-primary-500/30 transition-colors font-medium"
                          >
                            <Users className="h-4 w-4" />
                            <span>View Team Profile</span>
                          </Link>
                          
                          {teamRef.isActive && (
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-green-400 text-sm font-medium">Currently Active</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-secondary-800 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-secondary-700">
                      <Users className="h-10 w-10 text-secondary-500" />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-3">No Teams Joined</h4>
                    <p className="text-secondary-400 mb-6 max-w-md mx-auto">
                      {isOwnProfile 
                        ? "You haven't joined any teams yet. Start your gaming journey by joining a team!"
                        : "This player hasn't joined any teams yet."
                      }
                    </p>
                    {isOwnProfile && (
                      <div className="flex items-center justify-center space-x-4">
                        <Link
                          to="/search"
                          className="inline-flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors font-medium"
                        >
                          <Users className="h-4 w-4" />
                          <span>Find Teams</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'gaming' && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Gaming Statistics</h3>
                  {isOwnProfile && (
                    <button
                      onClick={() => setShowGamingStatsModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Add Game Stats</span>
                      <span className="sm:hidden">Add Stats</span>
                    </button>
                  )}
                </div>
                
                {user.playerInfo?.gamingStats && user.playerInfo.gamingStats.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {user.playerInfo.gamingStats.map((stat: any, index) => {
                      const getGameIcon = (game: string) => {
                        const icons: { [key: string]: string } = {
                          'BGMI': '🎮',
                          'Clash of Clans': '🏰',
                          'Clash Royale': '👑',
                          'Chess.com': '♟️',
                          'Fortnite': '🏗️',
                          'Call of Duty Mobile': '🔫',
                          'Valorant': '💎',
                          'Free Fire Max': '🔥',
                          'PUBG Mobile': '🎯',
                          'Rocket League': '⚽'
                        };
                        return icons[game] || '🎮';
                      };

                      const getGameColor = (game: string) => {
                        const colors: { [key: string]: string } = {
                          'BGMI': 'from-orange-500 to-red-600',
                          'Clash of Clans': 'from-blue-500 to-purple-600',
                          'Clash Royale': 'from-yellow-500 to-orange-600',
                          'Chess.com': 'from-gray-600 to-gray-800',
                          'Fortnite': 'from-green-500 to-blue-600',
                          'Call of Duty Mobile': 'from-red-500 to-orange-600',
                          'Valorant': 'from-purple-500 to-pink-600',
                          'Free Fire Max': 'from-yellow-500 to-red-600',
                          'PUBG Mobile': 'from-blue-600 to-green-600',
                          'Rocket League': 'from-orange-500 to-yellow-600'
                        };
                        return colors[game] || 'from-blue-500 to-purple-600';
                      };

                      return (
                        <div key={stat._id || index} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl">
                          <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                              <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${getGameColor(stat.game)} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg`}>
                                <span className="text-xl sm:text-3xl">{getGameIcon(stat.game)}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-white text-lg sm:text-xl truncate">{stat.game}</h4>
                                <p className="text-gray-400 text-xs sm:text-sm truncate">
                                  @{stat.inGameName || stat.epicUsername || stat.username || 'Unknown'}
                                </p>
                              </div>
                            </div>
                            {isOwnProfile && (
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <button
                                  onClick={() => handleEditGamingStat(stat)}
                                  className="p-2 sm:p-3 text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg sm:rounded-xl transition-all duration-200"
                                >
                                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteGamingStat(stat._id || index)}
                                  className="p-2 sm:p-3 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg sm:rounded-xl transition-all duration-200"
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {/* Game-specific stats display */}
                          <div className="space-y-3 sm:space-y-4">
                            {/* BGMI Stats */}
                            {stat.game === 'BGMI' && (
                              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Character ID</div>
                                  <div className="text-white font-medium">{stat.characterId}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">ID Level</div>
                                  <div className="text-white font-medium">{stat.idLevel}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Role</div>
                                  <div className="text-blue-400 font-medium">{stat.role}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">F/D Ratio</div>
                                  <div className="text-green-400 font-bold text-lg">{stat.fdRatio}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-xl p-4 col-span-2">
                                  <div className="text-xs text-gray-400 mb-1">Current Tier</div>
                                  <div className="text-yellow-400 font-bold text-lg">{stat.currentTier}</div>
                                </div>
                              </div>
                            )}

                            {/* Clash of Clans Stats */}
                            {stat.game === 'Clash of Clans' && (
                              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Player Tag</div>
                                  <div className="text-white font-medium">{stat.playerTag}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">ID Level</div>
                                  <div className="text-white font-medium">{stat.idLevel}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-xl p-4 col-span-2">
                                  <div className="text-xs text-gray-400 mb-1">Townhall Level</div>
                                  <div className="text-blue-400 font-bold text-lg">{stat.townhallLevel}</div>
                                </div>
                              </div>
                            )}

                            {/* Clash Royale Stats */}
                            {stat.game === 'Clash Royale' && (
                              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Player Tag</div>
                                  <div className="text-white font-medium">{stat.playerTag}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">ID Level</div>
                                  <div className="text-white font-medium">{stat.idLevel}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-xl p-4 col-span-2">
                                  <div className="text-xs text-gray-400 mb-1">Arena</div>
                                  <div className="text-yellow-400 font-bold text-lg">{stat.arena}</div>
                                </div>
                              </div>
                            )}

                            {/* Chess.com Stats */}
                            {stat.game === 'Chess.com' && (
                              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Username</div>
                                  <div className="text-white font-medium">{stat.username}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Rating</div>
                                  <div className="text-green-400 font-bold text-lg">{stat.rating}</div>
                                </div>
                                {stat.title && (
                                  <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                    <div className="text-xs text-gray-400 mb-1">Title</div>
                                    <div className="text-yellow-400 font-medium">{stat.title}</div>
                                  </div>
                                )}
                                {stat.puzzleRating && (
                                  <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                    <div className="text-xs text-gray-400 mb-1">Puzzle Rating</div>
                                    <div className="text-blue-400 font-medium">{stat.puzzleRating}</div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Fortnite Stats */}
                            {stat.game === 'Fortnite' && (
                              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Epic Username</div>
                                  <div className="text-white font-medium">{stat.epicUsername}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Level</div>
                                  <div className="text-white font-medium">{stat.level}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Total Wins</div>
                                  <div className="text-green-400 font-bold text-lg">{stat.wins}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">K/D Ratio</div>
                                  <div className="text-blue-400 font-bold text-lg">{stat.kd}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-xl p-4 col-span-2">
                                  <div className="text-xs text-gray-400 mb-1">Playstyle</div>
                                  <div className="text-purple-400 font-medium">{stat.playstyle}</div>
                                </div>
                              </div>
                            )}

                            {/* Valorant Stats */}
                            {stat.game === 'Valorant' && (
                              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">In-Game Name</div>
                                  <div className="text-white font-medium">{stat.inGameName}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Tag</div>
                                  <div className="text-white font-medium">{stat.tag}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Current Rank</div>
                                  <div className="text-purple-400 font-bold text-lg">{stat.rank}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Role</div>
                                  <div className="text-blue-400 font-medium">{stat.role}</div>
                                </div>
                                {stat.rr && (
                                  <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                    <div className="text-xs text-gray-400 mb-1">Rank Rating</div>
                                    <div className="text-green-400 font-bold text-lg">{stat.rr} RR</div>
                                  </div>
                                )}
                                {stat.peakRank && (
                                  <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                    <div className="text-xs text-gray-400 mb-1">Peak Rank</div>
                                    <div className="text-yellow-400 font-bold text-lg">{stat.peakRank}</div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Call of Duty Mobile Stats */}
                            {stat.game === 'Call of Duty Mobile' && (
                              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">In-Game Name</div>
                                  <div className="text-white font-medium">{stat.inGameName}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Player UID</div>
                                  <div className="text-white font-medium">{stat.uid}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Level</div>
                                  <div className="text-white font-medium">{stat.level}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Current Rank</div>
                                  <div className="text-red-400 font-bold text-lg">{stat.rank}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Role</div>
                                  <div className="text-blue-400 font-medium">{stat.role}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">K/D Ratio</div>
                                  <div className="text-green-400 font-bold text-lg">{stat.kd}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-xl p-4 col-span-2">
                                  <div className="text-xs text-gray-400 mb-1">Total Wins</div>
                                  <div className="text-orange-400 font-bold text-lg">{stat.wins}</div>
                                </div>
                              </div>
                            )}

                            {/* Free Fire Max Stats */}
                            {stat.game === 'Free Fire Max' && (
                              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">In-Game Name</div>
                                  <div className="text-white font-medium">{stat.inGameName}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Player UID</div>
                                  <div className="text-white font-medium">{stat.uid}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Level</div>
                                  <div className="text-white font-medium">{stat.level}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Current Rank</div>
                                  <div className="text-yellow-400 font-bold text-lg">{stat.rank}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Role</div>
                                  <div className="text-blue-400 font-medium">{stat.role}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">K/D Ratio</div>
                                  <div className="text-green-400 font-bold text-lg">{stat.kd}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-xl p-4 col-span-2">
                                  <div className="text-xs text-gray-400 mb-1">Matches Played</div>
                                  <div className="text-red-400 font-bold text-lg">{stat.matchesPlayed}</div>
                                </div>
                              </div>
                            )}

                            {/* PUBG Mobile Stats */}
                            {stat.game === 'PUBG Mobile' && (
                              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">In-Game Name</div>
                                  <div className="text-white font-medium">{stat.inGameName}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Player UID</div>
                                  <div className="text-white font-medium">{stat.uid}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Level</div>
                                  <div className="text-white font-medium">{stat.level}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Current Rank</div>
                                  <div className="text-blue-400 font-bold text-lg">{stat.rank}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Role</div>
                                  <div className="text-blue-400 font-medium">{stat.role}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">K/D Ratio</div>
                                  <div className="text-green-400 font-bold text-lg">{stat.kd}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-xl p-4 col-span-2">
                                  <div className="text-xs text-gray-400 mb-1">Matches Played</div>
                                  <div className="text-green-400 font-bold text-lg">{stat.matchesPlayed}</div>
                                </div>
                              </div>
                            )}

                            {/* Rocket League Stats */}
                            {stat.game === 'Rocket League' && (
                              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">In-Game Name</div>
                                  <div className="text-white font-medium">{stat.inGameName}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Platform</div>
                                  <div className="text-white font-medium">{stat.platform}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Current Rank</div>
                                  <div className="text-orange-400 font-bold text-lg">{stat.rank}</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Position</div>
                                  <div className="text-blue-400 font-medium">{stat.role}</div>
                                </div>
                                {stat.mmr && (
                                  <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                    <div className="text-xs text-gray-400 mb-1">MMR</div>
                                    <div className="text-yellow-400 font-bold text-lg">{stat.mmr}</div>
                                  </div>
                                )}
                                <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="text-xs text-gray-400 mb-1">Total Wins</div>
                                  <div className="text-green-400 font-bold text-lg">{stat.wins}</div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-800 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-gray-700">
                      <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-gray-500" />
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">No Gaming Stats</h4>
                    <p className="text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base px-4">
                      {isOwnProfile 
                        ? "Add your gaming statistics to showcase your skills and achievements!"
                        : "This player hasn't added any gaming statistics yet."
                      }
                    </p>
                    {isOwnProfile && (
                      <button
                        onClick={() => setShowGamingStatsModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2 mx-auto text-sm sm:text-base"
                      >
                        <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">Add Your First Game Stats</span>
                        <span className="sm:hidden">Add Game Stats</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>
      </div>

      {/* Leave Request Modal */}
      {selectedTeamForLeave && (
        <LeaveRequestModal
          isOpen={showLeaveRequestModal}
          onClose={() => {
            setShowLeaveRequestModal(false);
            setSelectedTeamForLeave(null);
          }}
          teamId={selectedTeamForLeave?.id}
          teamName={selectedTeamForLeave?.name}
          onSuccess={() => {
            fetchUserProfile();
            setMessage({ type: 'success', text: 'Leave request submitted successfully!' });
            setTimeout(() => setMessage(null), 3000);
          }}
        />
      )}

      {/* Gaming Stats Modal */}
      <GamingStatsModal
        isOpen={showGamingStatsModal}
        onClose={() => {
          setShowGamingStatsModal(false);
          setEditingGamingStat(null);
        }}
        onSave={handleSaveGamingStat}
        editingStat={editingGamingStat}
      />

      {/* Followers Modal */}
      <FollowersListModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        userId={targetUserId || ''}
        type="followers"
        title="Followers"
      />

      {/* Following Modal */}
      <FollowersListModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        userId={targetUserId || ''}
        type="following"
        title="Following"
      />

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full">
              <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
              Delete Post
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPostToDelete(null);
                }}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePost}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default Profile;
