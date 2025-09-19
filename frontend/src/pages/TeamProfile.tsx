import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  MapPin, 
  Calendar, 
  Mail, 
  Gamepad2, 
  Trophy, 
  Settings, 
  Edit, 
  Plus, 
  Heart, 
  MessageCircle, 
  Share2, 
  Crown,
  Star,
  Award,
  Target,
  Flame,
  Zap,
  Shield,
  UserCheck,
  UserPlus,
  Briefcase,
  Users2,
  GamepadIcon,
  Trash2,
  Clock,
  Home,
  Search,
  User
} from 'lucide-react';
import axios from 'axios';
import AddPlayerModal from '../components/AddPlayerModal';
import MobileBottomNav from '../components/MobileBottomNav';
import LeaveRequestsManagement from '../components/LeaveRequestsManagement';
import FollowersListModal from '../components/FollowersListModal';

interface TeamUser {
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
    gamingPreferences?: string[];
    socialLinks?: {
      discord?: string;
      steam?: string;
      twitch?: string;
    };
  };
  teamInfo?: {
    teamSize: number;
    recruitingFor: string[];
    requirements: string;
    teamType: string;
    members: Array<{
      user: {
        _id: string;
        username: string;
        profile?: {
          displayName?: string;
          avatar?: string;
          banner?: string;
        };
      };
      role: string;
      joinedAt: string;
    }>;
    rosters: Array<{
      game: string;
      players: Array<{
        user: {
          _id: string;
          username: string;
          profile?: {
            displayName?: string;
            avatar?: string;
          };
        };
        role: string;
        inGameName: string;
        joinedAt: string;
        leftAt?: string;
        isActive?: boolean;
      }>;
      isActive: boolean;
    }>;
    staff: Array<{
      user: {
        _id: string;
        username: string;
        profile?: {
          displayName?: string;
          avatar?: string;
          banner?: string;
        };
      };
      role: string;
      joinedAt: string;
      leftAt?: string;
      isActive?: boolean;
      leaveRequestStatus?: 'none' | 'pending' | 'approved' | 'rejected';
    }>;
  };
  followers?: string[];
  following?: string[];
  createdAt: string;
}

interface Post {
  _id: string;
  content: string | {
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
  likes: string[];
  comments: any[];
  createdAt: string;
  tags?: string[];
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    publicId: string;
  }>;
}

const TeamProfile: React.FC = () => {
  const { id: teamId } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const location = useLocation();
  const [team, setTeam] = useState<TeamUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'rosters' | 'staff' | 'about' | 'invites'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  
  // Modal states
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showLeaveRequestsModal, setShowLeaveRequestsModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [pendingInvites, setPendingInvites] = useState<{
    rosterInvites: any[];
    staffInvites: any[];
  }>({ rosterInvites: [], staffInvites: [] });
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  const isOwnProfile = currentUser?._id === teamId;

  useEffect(() => {
    if (teamId) {
      fetchTeamProfile();
      fetchTeamPosts();
      if (isOwnProfile) {
        fetchPendingInvites();
      }
    }
  }, [teamId, isOwnProfile]);

  const fetchTeamProfile = async () => {
    try {
      // Add cache-busting parameter to ensure fresh data
      const response = await axios.get(`/api/users/${teamId}?t=${Date.now()}`);
      const teamData = response.data.data?.user;
      
      if (!teamData) {
        console.error('No team data found in response');
        setLoading(false);
        return;
      }
      
      setTeam(teamData);
      
      // Check if current user is following this team
      if (currentUser && teamData.followers) {
        setIsFollowing(teamData.followers.includes(currentUser._id));
      }
      
      setFollowersCount(teamData.followers?.length || 0);
      setFollowingCount(teamData.following?.length || 0);
    } catch (error) {
      console.error('Error fetching team profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamPosts = async () => {
    try {
      // Add cache-busting parameter to ensure fresh data
      const response = await axios.get(`/api/users/${teamId}/posts?t=${Date.now()}`);
      setPosts(response.data.data?.posts || []);
    } catch (error: any) {
      console.error('Error fetching team posts:', error);
    }
  };

  const fetchPendingInvites = async () => {
    try {
      const response = await axios.get(`/api/users/${teamId}/pending-invites`);
      setPendingInvites(response.data.data);
    } catch (error) {
      console.error('Error fetching pending invites:', error);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) return;

    try {
      if (isFollowing) {
        await axios.delete(`/api/users/${teamId}/follow`);
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
      } else {
        await axios.post(`/api/users/${teamId}/follow`);
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Error following/unfollowing:', error);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await axios.post(`/api/posts/${postId}/like`);
      setPosts(prev => prev.map(post => {
        if (post._id === postId) {
          const isLiked = post.likes.includes(currentUser?._id || '');
          return {
            ...post,
            likes: isLiked 
              ? post.likes.filter(id => id !== currentUser?._id)
              : [...post.likes, currentUser?._id || '']
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleRemovePlayer = async (game: string, playerId: string) => {
    try {
      await axios.delete(`/api/users/${teamId}/roster/${game}/${playerId}`);
      // Refresh team data
      fetchTeamProfile();
    } catch (error) {
      console.error('Error removing player:', error);
    }
  };

  const handleRemoveStaff = async (memberId: string) => {
    try {
      const response = await axios.delete(`/api/users/${teamId}/staff/${memberId}`);
      
      if (response.data.success) {
        // Show success message
        alert('Staff member removed successfully!');
        // Refresh team data
        fetchTeamProfile();
      }
    } catch (error: any) {
      console.error('Error removing staff member:', error);
      const errorMessage = error.response?.data?.message || 'Failed to remove staff member';
      alert(errorMessage);
    }
  };

  const handleAddPlayerSuccess = () => {
    fetchTeamProfile();
    fetchPendingInvites();
  };

  const handleAddStaffSuccess = () => {
    fetchTeamProfile();
    fetchPendingInvites();
  };

  const handleCancelInvite = async (inviteId: string, type: 'roster' | 'staff') => {
    try {
      const endpoint = type === 'roster' ? `/api/users/roster-invite/${inviteId}` : `/api/users/staff-invite/${inviteId}`;
      const response = await axios.delete(endpoint);
      
      if (response.data.success) {
        // Show success message (you can add a toast notification here)
        console.log(`${type} invite cancelled successfully`);
        
        // Refresh pending invites
        fetchPendingInvites();
      }
    } catch (error: any) {
      console.error(`Error cancelling ${type} invite:`, error);
      
      // Show error message to user
      const errorMessage = error.response?.data?.message || `Failed to cancel ${type} invite`;
      alert(errorMessage); // You can replace this with a proper toast notification
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDisplayName = (team: TeamUser) => {
    return team.profile?.displayName || team.username;
  };

  const getProfilePicture = (team: TeamUser) => {
    return team.profilePicture || team.profile?.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNjAiIHI9IjYwIiBmaWxsPSIjMzczNzNBIi8+CjxwYXRoIGQ9Ik02MCAzMEM2Ni4yNzQxIDMwIDcxLjQgMzUuMTI1OSA3MS40IDQxLjRDNzEuNCA0Ny42NzQxIDY2LjI3NDEgNTIuOCA2MCA1Mi44QzUzLjcyNTkgNTIuOCA0OC42IDQ3LjY3NDEgNDguNiA0MS40QzQ4LjYgMzUuMTI1OSA1My43MjU5IDMwIDYwIDMwWiIgZmlsbD0iIzZCNkI2QiIvPgo8cGF0aCBkPSJNODQgOTBDODQgNzguOTU0MyA3My4wNDU3IDY4IDYwIDY4QzQ2Ljk1NDMgNjggMzYgNzguOTU0MyAzNiA5MEg4NFoiIGZpbGw9IiM2QjZCNkIiLz4KPC9zdmc+Cg==';
  };

  const getUserProfilePicture = (user: any) => {
    return user.profile?.avatar || user.profilePicture || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMzNzM3M0EiLz4KPHBhdGggZD0iTTIwIDEwQzIyLjIwOTEgMTAgMjQgMTEuNzkwOSAyNCAxNEMyNCAxNi4yMDkxIDIyLjIwOTEgMTggMjAgMThDMTcuNzkwOSAxOCAxNiAxNi4yMDkxIDE2IDE0QzE2IDExLjc5MDkgMTYuNzkwOSAxMCAyMCAxMFoiIGZpbGw9IiM2QjZCNkIiLz4KPHBhdGggZD0iTTI4IDMwQzI4IDI2LjY4NjMgMjQuNDE4MyAyNCAyMCAyNEMxNS41ODE3IDI0IDEyIDI2LjY4NjMgMTIgMzBIMjhaIiBmaWxsPSIjNkI2QjZCIi8+Cjwvc3ZnPgo=';
  };

  const getGameIcon = (game: string) => {
    switch (game) {
      case 'BGMI': return '🎮';
      case 'Valorant': return '🔫';
      case 'Free Fire': return '🔥';
      case 'Call of Duty Mobile': return '🎯';
      default: return '🎮';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse">
            <div className="h-64 bg-secondary-800 rounded-lg mb-6"></div>
            <div className="h-8 bg-secondary-800 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-secondary-800 rounded w-1/2 mb-6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-black pt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Team not found</h1>
            <p className="text-secondary-400">The team you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-0 lg:pt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        {/* Team Header */}
        <div className="card mb-6">
          <div className="relative h-48 sm:h-64 rounded-t-lg overflow-hidden">
            {team?.profile?.banner ? (
              <img
                src={team.profile.banner}
                alt="Team Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-secondary-800 to-secondary-900"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            
            {/* Team Avatar */}
            <div className="absolute bottom-3 left-4 sm:bottom-4 sm:left-6">
              <div className="relative">
                {/* Background circle for better contrast */}
                <div className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-black/30 blur-sm"></div>
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-2xl bg-white/10 backdrop-blur-sm">
                  <img
                    src={getProfilePicture(team)}
                    alt={getDisplayName(team)}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-primary-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="absolute bottom-3 right-4 sm:bottom-4 sm:right-6 flex space-x-2 sm:space-x-3">
              {isOwnProfile ? (
                <Link
                  to={`/team/${teamId}/edit`}
                  className="flex items-center space-x-1 sm:space-x-2 bg-primary-500 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-primary-600 transition-colors text-sm sm:text-base"
                >
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Edit Profile</span>
                  <span className="sm:hidden">Edit</span>
                </Link>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    className={`flex items-center space-x-1 sm:space-x-2 px-3 py-2 sm:px-4 rounded-lg transition-colors text-sm sm:text-base ${
                      isFollowing
                        ? 'bg-secondary-700 text-white'
                        : 'bg-primary-500 text-white hover:bg-primary-600'
                    }`}
                  >
                    <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${isFollowing ? 'fill-current' : ''}`} />
                    <span className="hidden sm:inline">{isFollowing ? 'Following' : 'Follow'}</span>
                    <span className="sm:hidden">{isFollowing ? '✓' : '+'}</span>
                  </button>
                  <Link
                    to={`/messages?user=${teamId}`}
                    className="flex items-center space-x-1 sm:space-x-2 bg-secondary-700 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-secondary-600 transition-colors text-sm sm:text-base"
                  >
                    <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Message</span>
                    <span className="sm:hidden">Msg</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Team Info */}
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-4 sm:space-y-0">
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{getDisplayName(team)}</h1>
                <p className="text-secondary-400 mb-2 text-sm sm:text-base">Professional Gaming Team</p>
                {team.profile?.location && (
                  <div className="flex items-center justify-center sm:justify-start text-secondary-400 text-sm sm:text-base">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span>{team.profile.location}</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-center sm:justify-end">
                <div className="flex items-center space-x-4 sm:space-x-6 text-xs sm:text-sm">
                  <div 
                    className="text-center cursor-pointer hover:scale-110 transition-all duration-300"
                    onClick={() => setShowFollowersModal(true)}
                  >
                    <div className="text-white font-semibold text-sm sm:text-base">{followersCount}</div>
                    <div className="text-secondary-400">Followers</div>
                  </div>
                  <div 
                    className="text-center cursor-pointer hover:scale-110 transition-all duration-300"
                    onClick={() => setShowFollowingModal(true)}
                  >
                    <div className="text-white font-semibold text-sm sm:text-base">{followingCount}</div>
                    <div className="text-secondary-400">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-semibold text-sm sm:text-base">{team.teamInfo?.teamSize || 0}</div>
                    <div className="text-secondary-400">Members</div>
                  </div>
                </div>
              </div>
            </div>

            {team.profile?.bio && (
              <p className="text-secondary-300 mb-4 text-sm sm:text-base">{team.profile.bio}</p>
            )}

            {/* Team Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="bg-secondary-800 rounded-lg p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-2xl font-bold text-primary-500 mb-1">
                  {team.teamInfo?.rosters?.length || 0}
                </div>
                <div className="text-xs sm:text-sm text-secondary-400">Game Rosters</div>
              </div>
              <div className="bg-secondary-800 rounded-lg p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-2xl font-bold text-primary-500 mb-1">
                  {team.teamInfo?.staff?.length || 0}
                </div>
                <div className="text-xs sm:text-sm text-secondary-400">Staff Members</div>
              </div>
              <div className="bg-secondary-800 rounded-lg p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-2xl font-bold text-primary-500 mb-1">
                  {team.teamInfo?.members?.length || 0}
                </div>
                <div className="text-xs sm:text-sm text-secondary-400">Total Members</div>
              </div>
              <div className="bg-secondary-800 rounded-lg p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-2xl font-bold text-primary-500 mb-1">
                  {team.teamInfo?.teamType || 'Casual'}
                </div>
                <div className="text-xs sm:text-sm text-secondary-400">Team Type</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card mb-6">
          <div className="flex overflow-x-auto space-x-1 p-4 pb-2">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'posts'
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-secondary-300 hover:text-white hover:bg-secondary-700/50'
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab('rosters')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'rosters'
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-secondary-300 hover:text-white hover:bg-secondary-700/50'
              }`}
            >
              Rosters
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'staff'
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-secondary-300 hover:text-white hover:bg-secondary-700/50'
              }`}
            >
              Staff
            </button>
            {isOwnProfile && (
              <button
                onClick={() => setActiveTab('invites')}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'invites'
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'text-secondary-300 hover:text-white hover:bg-secondary-700/50'
                }`}
              >
                <span className="hidden sm:inline">Pending Invites</span>
                <span className="sm:hidden">Invites</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('about')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'about'
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-secondary-300 hover:text-white hover:bg-secondary-700/50'
              }`}
            >
              About
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'posts' && (
          <div className="space-y-4 sm:space-y-6">
            {posts.map((post) => (
              <div key={post._id} className="card">
                <div className="flex items-start space-x-3 p-4">
                  <img
                    src={getProfilePicture(team)}
                    alt={getDisplayName(team)}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-2">
                      <span className="font-semibold text-white text-sm sm:text-base truncate">{getDisplayName(team)}</span>
                      <span className="text-secondary-400 text-xs sm:text-sm">•</span>
                      <span className="text-secondary-400 text-xs sm:text-sm">{formatDate(post.createdAt)}</span>
                    </div>
                    <p className="text-white mb-3 text-sm sm:text-base break-words">
                      {typeof post.content === 'string' ? post.content : post.content.text}
                    </p>
                    {post.media && post.media.length > 0 && (
                      <div className="mb-3">
                        {post.media.map((media, index) => (
                          <div key={index} className="mb-2">
                            {media.type === 'image' ? (
                              <img src={media.url} alt="" className="rounded-lg max-w-full h-auto" />
                            ) : (
                              <video src={media.url} controls className="rounded-lg max-w-full w-full h-auto" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <button
                        onClick={() => handleLike(post._id)}
                        className={`flex items-center space-x-1 text-xs sm:text-sm transition-colors ${
                          post.likes.includes(currentUser?._id || '')
                            ? 'text-primary-500'
                            : 'text-secondary-400 hover:text-white'
                        }`}
                      >
                        <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${post.likes.includes(currentUser?._id || '') ? 'fill-current' : ''}`} />
                        <span>{post.likes.length}</span>
                      </button>
                      <button className="flex items-center space-x-1 text-xs sm:text-sm text-secondary-400 hover:text-white">
                        <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{post.comments.length}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'rosters' && (
          <div className="space-y-4 sm:space-y-6">
            {team.teamInfo?.rosters?.map((roster) => (
              <div key={roster.game} className="card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b border-secondary-800 space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl sm:text-2xl">{getGameIcon(roster.game)}</span>
                    <h3 className="text-lg sm:text-xl font-semibold text-white">{roster.game} Roster</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      roster.isActive 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {roster.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {isOwnProfile && (
                    <button 
                      onClick={() => {
                        setSelectedGame(roster.game);
                        setShowAddPlayerModal(true);
                      }}
                      className="flex items-center justify-center space-x-2 bg-primary-500 text-white px-3 py-2 rounded-lg hover:bg-primary-600 transition-colors text-sm sm:text-base"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span className="hidden sm:inline">Add Player</span>
                      <span className="sm:hidden">Add</span>
                    </button>
                  )}
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {roster.players.map((player) => (
                                           <div key={player.user._id} className="bg-secondary-800 rounded-lg p-3 sm:p-4 border-2 border-transparent">
                       <div className="flex items-center space-x-3 mb-3">
                         <div className="relative flex-shrink-0">
                           <img
                             src={getUserProfilePicture(player.user)}
                             alt={player.user.profile?.displayName || player.user.username}
                             className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                           />
                         </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-white text-sm sm:text-base truncate">
                              {player.user.profile?.displayName || player.user.username}
                            </div>
                            <div className="text-xs sm:text-sm text-secondary-400 truncate">
                              {player.inGameName || 'No IGN'}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                                                     <div className="flex items-center space-x-2">
                             <span className={`px-2 py-1 rounded text-xs ${
                               player.role === 'Captain' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                               player.role === 'Coach' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                               'bg-secondary-700 text-secondary-300'
                             }`}>
                               {player.role}
                             </span>
                           </div>
                                                     <div className="flex items-center justify-between sm:justify-end space-x-2">
                             <div className="text-xs text-secondary-400">
                               <div>Joined: {formatDate(player.joinedAt)}</div>
                             </div>
                             {isOwnProfile && (
                               <button
                                 onClick={() => handleRemovePlayer(roster.game, player.user._id)}
                                 className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                                 title="Remove player"
                               >
                                 <Trash2 className="h-3 w-3" />
                               </button>
                             )}
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="card">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b border-secondary-800 space-y-3 sm:space-y-0">
                <h3 className="text-lg sm:text-xl font-semibold text-white">Team Staff</h3>
                {isOwnProfile && (
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <button 
                      onClick={() => setShowLeaveRequestsModal(true)}
                      className="flex items-center justify-center space-x-2 bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                    >
                      <Clock className="h-4 w-4" />
                      <span className="hidden sm:inline">Leave Requests</span>
                      <span className="sm:hidden">Requests</span>
                    </button>
                    <button 
                      onClick={() => setShowAddStaffModal(true)}
                      className="flex items-center justify-center space-x-2 bg-primary-500 text-white px-3 py-2 rounded-lg hover:bg-primary-600 transition-colors text-sm"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span className="hidden sm:inline">Add Staff</span>
                      <span className="sm:hidden">Add</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {team.teamInfo?.staff?.map((staffMember) => (
                                         <div key={staffMember.user._id} className="bg-secondary-800 rounded-lg p-3 sm:p-4 border-2 border-transparent">
                       <div className="flex items-center space-x-3 mb-3">
                         <div className="relative flex-shrink-0">
                           <img
                             src={getUserProfilePicture(staffMember.user)}
                             alt={staffMember.user.profile?.displayName || staffMember.user.username}
                             className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                           />
                         </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-white text-sm sm:text-base truncate">
                            {staffMember.user.profile?.displayName || staffMember.user.username}
                          </div>
                          <div className="text-xs sm:text-sm text-secondary-400 truncate">
                            {staffMember.role}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-secondary-400">
                          Joined {formatDate(staffMember.joinedAt)}
                        </span>
                        {isOwnProfile && (
                          <button
                            onClick={() => handleRemoveStaff(staffMember.user._id)}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                            title="Remove staff member"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invites' && isOwnProfile && (
          <div className="space-y-4 sm:space-y-6">
            {/* Roster Invites */}
            <div className="card">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b border-secondary-800 space-y-2 sm:space-y-0">
                <h3 className="text-lg sm:text-xl font-semibold text-white">Pending Roster Invites</h3>
                <span className="text-xs sm:text-sm text-secondary-400">
                  {pendingInvites.rosterInvites.length} invites
                </span>
              </div>
              <div className="p-4">
                {pendingInvites.rosterInvites.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {pendingInvites.rosterInvites.map((invite) => (
                      <div key={invite._id} className="bg-secondary-800 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                          <div className="flex items-center space-x-3">
                            <img
                              src={invite.player.profile?.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMzNzM3M0EiLz4KPHBhdGggZD0iTTIwIDEwQzIyLjIwOTEgMTAgMjQgMTEuNzkwOSAyNCAxNEMyNCAxNi4yMDkxIDIyLjIwOTEgMTggMjAgMThDMTcuNzkwOSAxOCAxNiAxNi4yMDkxIDE2IDE0QzE2IDExLjc5MDkgMTYuNzkwOSAxMCAyMCAxMFoiIGZpbGw9IiM2QjZCNkIiLz4KPHBhdGggZD0iTTI4IDMwQzI4IDI2LjY4NjMgMjQuNDE4MyAyNCAyMCAyNEMxNS41ODE3IDI0IDEyIDI2LjY4NjMgMTIgMzBIMjhaIiBmaWxsPSIjNkI2QjZCIi8+Cjwvc3ZnPgo='}
                              alt={invite.player.profile?.displayName || invite.player.username}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-white text-sm sm:text-base truncate">
                                {invite.player.profile?.displayName || invite.player.username}
                              </div>
                              <div className="text-xs sm:text-sm text-secondary-400 truncate">
                                {invite.game} - {invite.role}
                              </div>
                              <div className="text-xs text-secondary-500">
                                Invited {formatDate(invite.createdAt)}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCancelInvite(invite._id, 'roster')}
                            className="px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-secondary-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-secondary-700">
                      <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-secondary-500" />
                    </div>
                    <h4 className="font-bold text-white mb-2 text-sm sm:text-base">No pending roster invites</h4>
                    <p className="text-xs sm:text-sm text-secondary-400">All roster invites have been responded to</p>
                  </div>
                )}
              </div>
            </div>

            {/* Staff Invites */}
            <div className="card">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b border-secondary-800 space-y-2 sm:space-y-0">
                <h3 className="text-lg sm:text-xl font-semibold text-white">Pending Staff Invites</h3>
                <span className="text-xs sm:text-sm text-secondary-400">
                  {pendingInvites.staffInvites.length} invites
                </span>
              </div>
              <div className="p-4">
                {pendingInvites.staffInvites.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {pendingInvites.staffInvites.map((invite) => (
                      <div key={invite._id} className="bg-secondary-800 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                          <div className="flex items-center space-x-3">
                            <img
                              src={invite.player.profile?.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMzNzM3M0EiLz4KPHBhdGggZD0iTTIwIDEwQzIyLjIwOTEgMTAgMjQgMTEuNzkwOSAyNCAxNEMyNCAxNi4yMDkxIDIyLjIwOTEgMTggMjAgMThDMTcuNzkwOSAxOCAxNiAxNi4yMDkxIDE2IDE0QzE2IDExLjc5MDkgMTYuNzkwOSAxMCAyMCAxMFoiIGZpbGw9IiM2QjZCNkIiLz4KPHBhdGggZD0iTTI4IDMwQzI4IDI2LjY4NjMgMjQuNDE4MyAyNCAyMCAyNEMxNS41ODE3IDI0IDEyIDI2LjY4NjMgMTIgMzBIMjhaIiBmaWxsPSIjNkI2QjZCIi8+Cjwvc3ZnPgo='}
                              alt={invite.player.profile?.displayName || invite.player.username}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-white text-sm sm:text-base truncate">
                                {invite.player.profile?.displayName || invite.player.username}
                              </div>
                              <div className="text-xs sm:text-sm text-secondary-400 truncate">
                                {invite.role}
                              </div>
                              <div className="text-xs text-secondary-500">
                                Invited {formatDate(invite.createdAt)}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCancelInvite(invite._id, 'staff')}
                            className="px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-secondary-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-secondary-700">
                      <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-secondary-500" />
                    </div>
                    <h4 className="font-bold text-white mb-2 text-sm sm:text-base">No pending staff invites</h4>
                    <p className="text-xs sm:text-sm text-secondary-400">All staff invites have been responded to</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="card">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">About {getDisplayName(team)}</h3>
              
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h4 className="text-base sm:text-lg font-medium text-white mb-2">Team Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0">
                      <span className="text-secondary-400 text-sm sm:text-base">Team Type:</span>
                      <span className="text-white text-sm sm:text-base capitalize">{team.teamInfo?.teamType || 'Casual'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0">
                      <span className="text-secondary-400 text-sm sm:text-base">Team Size:</span>
                      <span className="text-white text-sm sm:text-base">{team.teamInfo?.teamSize || 0} members</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0">
                      <span className="text-secondary-400 text-sm sm:text-base">Founded:</span>
                      <span className="text-white text-sm sm:text-base">{formatDate(team.createdAt)}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0">
                      <span className="text-secondary-400 text-sm sm:text-base">Location:</span>
                      <span className="text-white text-sm sm:text-base">{team.profile?.location || 'Not specified'}</span>
                    </div>
                  </div>
                </div>

                {team.teamInfo?.requirements && (
                  <div>
                    <h4 className="text-base sm:text-lg font-medium text-white mb-2">Requirements</h4>
                    <p className="text-secondary-300 text-sm sm:text-base">{team.teamInfo.requirements}</p>
                  </div>
                )}

                {team.teamInfo?.recruitingFor && team.teamInfo.recruitingFor.length > 0 && (
                  <div>
                    <h4 className="text-base sm:text-lg font-medium text-white mb-2">Currently Recruiting For</h4>
                    <div className="flex flex-wrap gap-2">
                      {team.teamInfo.recruitingFor.map((position, index) => (
                        <span key={index} className="px-2 py-1 sm:px-3 bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded-lg text-xs sm:text-sm">
                          {position}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {team.profile?.socialLinks && (
                  <div>
                    <h4 className="text-base sm:text-lg font-medium text-white mb-2">Social Links</h4>
                    <div className="flex flex-wrap gap-3 sm:gap-4">
                      {team.profile.socialLinks.discord && (
                        <a href={team.profile.socialLinks.discord} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300 text-sm sm:text-base">
                          Discord
                        </a>
                      )}
                      {team.profile.socialLinks.steam && (
                        <a href={team.profile.socialLinks.steam} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300 text-sm sm:text-base">
                          Steam
                        </a>
                      )}
                      {team.profile.socialLinks.twitch && (
                        <a href={team.profile.socialLinks.twitch} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300 text-sm sm:text-base">
                          Twitch
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Player Modal */}
      <AddPlayerModal
        isOpen={showAddPlayerModal}
        onClose={() => setShowAddPlayerModal(false)}
        teamId={teamId || ''}
        type="roster"
        game={selectedGame}
        onSuccess={handleAddPlayerSuccess}
      />

      {/* Add Staff Modal */}
      <AddPlayerModal
        isOpen={showAddStaffModal}
        onClose={() => setShowAddStaffModal(false)}
        teamId={teamId || ''}
        type="staff"
        onSuccess={handleAddStaffSuccess}
      />

      {/* Leave Requests Management Modal */}
      <LeaveRequestsManagement
        isOpen={showLeaveRequestsModal}
        onClose={() => setShowLeaveRequestsModal(false)}
        teamId={teamId || ''}
        onUpdate={() => {
          fetchTeamProfile();
        }}
      />

      {/* Followers Modal */}
      <FollowersListModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        userId={teamId || ''}
        type="followers"
        title="Followers"
      />

      {/* Following Modal */}
      <FollowersListModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        userId={teamId || ''}
        type="following"
        title="Following"
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default TeamProfile;
