import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  Trophy, 
  Users, 
  Calendar, 
  DollarSign, 
  Gamepad2, 
  Settings,
  Crown,
  Target,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  X,
  UserPlus
} from 'lucide-react';
import axios from 'axios';
import TournamentDashboard from '../components/TournamentDashboard';
import TournamentParticipantView from '../components/TournamentParticipantView';
import TournamentBracket from '../components/TournamentBracket';

interface Tournament {
  _id: string;
  name: string;
  description: string;
  game: string;
  format: string;
  mode?: string;
  status: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  prizePool: number;
  entryFee: number;
  totalSlots: number;
  teamsPerGroup: number;
  numberOfGroups: number;
  prizePoolType: string;
  currentRound: number;
  totalRounds: number;
  participants: any[];
  teams: any[];
  groups: Array<{
    name: string;
    participants: any[];
    round: number;
    groupLetter?: string;
    _id?: string;
  }>;
  groupMessages?: Array<{
    groupId: string;
    round: number;
    messages: Array<{
      sender: {
        _id: string;
        username: string;
        profile?: {
          displayName?: string;
          avatar?: string;
        };
      };
      message: string;
      timestamp: string;
      type: 'text' | 'announcement' | 'system';
    }>;
  }>;
  tournamentMessages?: Array<{
    sender: {
      _id: string;
      username: string;
      profile?: {
        displayName?: string;
        avatar?: string;
      };
    };
    message: string;
    timestamp: string;
    type: 'text' | 'announcement' | 'system';
  }>;
  matches: any[];
  host: {
    _id: string;
    username: string;
    profile?: {
      displayName?: string;
      avatar?: string;
    };
  };
  winner?: {
    _id: string;
    username: string;
    profile?: {
      displayName?: string;
      avatar?: string;
    };
  };
  runnerUp?: {
    _id: string;
    username: string;
    profile?: {
      displayName?: string;
      avatar?: string;
    };
  };
  thirdPlace?: {
    _id: string;
    username: string;
    profile?: {
      displayName?: string;
      avatar?: string;
    };
  };
  broadcastChannels?: Array<{
    name: string;
    url: string;
    platform: string;
    isLive: boolean;
    groupId?: string;
    round?: number;
    description?: string;
    schedule?: string;
  }>;
  banner?: string;
  rules: string[];
  groupResults: Array<{
    round: number;
    groupId: string;
    groupName: string;
    teams: Array<{
      teamId: string;
      teamName: string;
      teamLogo?: string;
      wins: number;
      finishPoints: number;
      positionPoints: number;
      totalPoints: number;
      rank: number;
      qualified: boolean;
    }>;
    submittedAt?: string;
  }>;
  qualifications: Array<{
    round: number;
    qualifiedTeams: string[];
    qualificationCriteria: number;
    totalQualified: number;
    qualifiedAt: string;
  }>;
  roundSettings: Array<{
    round: number;
    teamsPerGroup: number;
    qualificationCriteria: number;
    totalGroups: number;
    totalTeams: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

const TournamentDetail: React.FC = () => {
  const { id, tournamentName, hostUsername } = useParams<{ 
    id?: string; 
    tournamentName?: string; 
    hostUsername?: string; 
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'overview' | 'results' | 'management'>('overview');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [followers, setFollowers] = useState<any[]>([]);
  const [selectedFollower, setSelectedFollower] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showTeamMembersDialog, setShowTeamMembersDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showTeamOnlyDialog, setShowTeamOnlyDialog] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  useEffect(() => {
    if (id || (tournamentName && hostUsername)) {
      fetchTournament();
    }
  }, [id, tournamentName, hostUsername]);

  // Refresh tournament data when URL changes (e.g., after team creation)
  useEffect(() => {
    if (tournament) {
      fetchTournament();
    }
  }, [location.search]);


  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const fetchTournament = async () => {
    try {
      setLoading(true);
      let response;
      
      if (id) {
        // Old URL structure: /tournament/:id
        response = await axios.get(`/api/tournaments/${id}`);
      } else if (tournamentName && hostUsername) {
        // New URL structure: /tournaments/:tournamentName/:hostUsername
        response = await axios.get(`/api/tournaments/by-name/${encodeURIComponent(tournamentName)}/${encodeURIComponent(hostUsername)}`);
      } else {
        throw new Error('Invalid tournament parameters');
      }
      
      setTournament(response.data.data.tournament);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch tournament');
    } finally {
      setLoading(false);
    }
  };

  const isHost = () => {
    return user && tournament && tournament.host._id === user._id;
  };

  const isParticipant = () => {
    if (!user || !tournament) return false;
    
    // Check if user is individual participant
    if (tournament.participants.some(p => p._id === user._id)) {
      return true;
    }
    
    // Check if user is a team that joined the tournament
    if (tournament.teams.some(team => team._id === user._id)) {
      return true;
    }
    
    // Check if user is part of any team (for both solo and duo tournaments)
    if (tournament.teams.some(team => 
      team.teamInfo?.members?.some((member: any) => 
        (typeof member.user === 'string' ? member.user : member.user?._id) === user._id
      )
    )) {
      return true;
    }
    
    return false;
  };

  const handleJoinTournament = async () => {
    if (!tournament) return;
    
    if (tournament.format === 'Solo') {
      try {
        await axios.post(`/api/tournaments/${tournament._id}/join`);
        fetchTournament(); // Refresh tournament data
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to join tournament');
      }
    } else if (tournament.format === 'Duo') {
      // Redirect to create duo page with tournament ID
      navigate(`/create-duo?tournamentId=${tournament._id}`);
    }
  };

  const handleLeaveTournament = async () => {
    if (!tournament || !user) return;
    
    setIsLeaving(true);
    try {
      // Find the team the user belongs to
      const userTeam = tournament.teams.find(team => 
        team.teamInfo?.members?.some((member: any) => 
          (typeof member.user === 'string' ? member.user : member.user._id) === user._id
        )
      );

      if (userTeam) {
        // Leave as team
        const response = await axios.post(`/api/tournaments/${tournament._id}/leave-team`, {
          teamId: userTeam._id
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.data.success) {
          // Refresh tournament data
          await fetchTournament();
          setShowLeaveDialog(false);
        }
      } else {
        // Leave as individual participant
        const response = await axios.post(`/api/tournaments/${tournament._id}/leave`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.data.success) {
          // Refresh tournament data
          await fetchTournament();
          setShowLeaveDialog(false);
        }
      }
    } catch (error) {
      console.error('Error leaving tournament:', error);
    } finally {
      setIsLeaving(false);
    }
  };

  const searchFollowers = async (query: string) => {
    if (!query.trim()) {
      setFollowers([]);
      return;
    }
    
    try {
      setSearchLoading(true);
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const response = await axios.get(`/api/users/search?search=${encodeURIComponent(query)}&followers=true&t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      setFollowers(response.data.data.users || []);
    } catch (err: any) {
      console.error('Failed to search followers:', err);
      setFollowers([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCreateDuoTeam = async () => {
    if (!tournament || !selectedFollower || !teamName.trim()) return;
    
    try {
      await axios.post(`/api/tournaments/${tournament._id}/join-duo`, {
        teamName: teamName.trim(),
        teammateId: selectedFollower._id
      });
      setShowTeamModal(false);
      setTeamName('');
      setSelectedFollower(null);
      setSearchQuery('');
      setFollowers([]);
      fetchTournament(); // Refresh tournament data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create duo team');
    }
  };


  const handleTeamClick = (team: any) => {
    setSelectedTeam(team);
    setShowTeamMembersDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Registration Open': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Ongoing': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Completed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'Ended': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
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
      <div className="min-h-screen bg-black flex items-center justify-center pt-4 md:pt-24">
        <div className="text-center px-4">
          <div className="relative">
            <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-gray-400/30 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 md:w-20 md:h-20 border-4 border-gray-400 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <h2 className="mt-6 text-2xl md:text-3xl font-bold text-white">Loading...</h2>
          <p className="mt-2 text-sm md:text-base text-gray-300">Fetching tournament details</p>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-4 md:pt-24">
        <div className="text-center px-4">
          <AlertCircle className="h-12 w-12 md:h-16 md:w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Tournament Not Found</h2>
          <p className="text-sm md:text-base text-gray-400 mb-6">{error || 'The tournament you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/tournaments')}
            className="px-4 py-2 md:px-6 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
          >
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  // If user is host, show management dashboard
  if (isHost()) {
    return (
      <TournamentDashboard 
        tournament={tournament} 
        onTournamentUpdated={fetchTournament}
      />
    );
  }

  // If user is participant, show participant view
  if (isParticipant()) {
    return (
      <TournamentParticipantView 
        tournament={tournament} 
        userId={user?._id || ''}
      />
    );
  }

  // Public tournament view for non-participants
  return (
    <div className="min-h-screen bg-black pt-4 md:pt-24">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 md:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <button
            onClick={() => navigate('/tournaments')}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4 lg:mb-6"
          >
            <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5" />
            <span className="text-sm lg:text-base">Back to Tournaments</span>
          </button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1">
              <div className="flex items-center space-x-3 lg:space-x-4 mb-3 lg:mb-4">
                <div className="text-2xl lg:text-4xl">{getGameIcon(tournament.game)}</div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl lg:text-4xl font-bold text-white truncate">{tournament.name}</h1>
                  <p className="text-gray-400 mt-1 lg:mt-2 text-sm lg:text-base line-clamp-2">{tournament.description}</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs lg:text-sm text-gray-400">
                <span className="flex items-center">
                  <Gamepad2 className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                  {tournament.game} • {tournament.format}
                </span>
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                  Starts {formatDate(tournament.startDate)}
                </span>
                <span className="flex items-center">
                  <Users className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                  {tournament.format === 'Solo' 
                    ? tournament.participants.length + tournament.teams.length 
                    : tournament.teams.length
                  }/{tournament.totalSlots} participants
                </span>
              </div>
            </div>

            <div className="text-left lg:text-right">
              <div className={`px-3 py-1 lg:px-4 lg:py-2 rounded-full text-xs lg:text-sm font-medium ${getStatusColor(tournament.status)}`}>
                {tournament.status}
              </div>
              <div className="text-xs lg:text-sm text-gray-400 mt-1 lg:mt-2">
                Hosted by {tournament.host.profile?.displayName || tournament.host.username}
              </div>
            </div>
          </div>
        </div>

        {/* Tournament Banner */}
        {tournament.banner && (
          <div className="mb-6 lg:mb-8">
            <img 
              src={tournament.banner} 
              alt={tournament.name}
              className="w-full h-48 lg:h-64 object-cover rounded-lg"
            />
          </div>
        )}

        {/* View Mode Tabs */}
        <div className="border-b border-gray-700 mb-4 lg:mb-6">
          <nav className="flex space-x-4 lg:space-x-8 overflow-x-auto">
            <button
              onClick={() => setViewMode('overview')}
              className={`py-3 lg:py-4 px-2 lg:px-1 border-b-2 font-medium text-xs lg:text-sm transition-colors whitespace-nowrap ${
                viewMode === 'overview'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('results')}
              className={`py-3 lg:py-4 px-2 lg:px-1 border-b-2 font-medium text-xs lg:text-sm transition-colors whitespace-nowrap ${
                viewMode === 'results'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
              }`}
            >
              Results
            </button>
          </nav>
        </div>

        {/* Content */}
        {viewMode === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-4 lg:space-y-6">
              {/* Tournament Info */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
                <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4">Tournament Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                  <div>
                    <h4 className="font-semibold text-white mb-2 lg:mb-3 text-sm lg:text-base">Game Details</h4>
                    <div className="space-y-2 text-xs lg:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Game:</span>
                        <span className="text-white">{tournament.game}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Format:</span>
                        <span className="text-white">{tournament.format}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(tournament.status)}`}>
                          {tournament.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2 lg:mb-3 text-sm lg:text-base">Tournament Structure</h4>
                    <div className="space-y-2 text-xs lg:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Teams per Group:</span>
                        <span className="text-white">{tournament.teamsPerGroup}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Groups:</span>
                        <span className="text-white">{tournament.numberOfGroups}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Rounds:</span>
                        <span className="text-white">{tournament.totalRounds}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Participants Section */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
                <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4 flex items-center">
                  <Users className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-blue-400" />
                  Participants ({
                    tournament.format === 'Solo' 
                      ? tournament.participants.length + tournament.teams.length 
                      : tournament.teams.length
                  }/{tournament.totalSlots})
                </h3>
                
                {/* Only show individual participants for Solo tournaments */}
                {tournament.format === 'Solo' && tournament.participants.length > 0 && (
                  <div className="mb-4 lg:mb-6">
                    <h4 className="font-semibold text-white mb-2 lg:mb-3 text-sm lg:text-base">Individual Participants</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3">
                      {tournament.participants.map((participant, index) => (
                        <div key={participant._id} className="flex items-center space-x-2 lg:space-x-3 p-2 lg:p-3 bg-gray-700/50 rounded-lg">
                          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-600 rounded-full flex items-center justify-center">
                            {participant.profile?.avatar ? (
                              <img 
                                src={participant.profile.avatar} 
                                alt={participant.username}
                                className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-xs lg:text-sm font-bold">
                                {participant.username.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white text-sm lg:text-base truncate">
                              {participant.profile?.displayName || participant.username}
                            </div>
                            <div className="text-xs text-gray-400 truncate">@{participant.username}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tournament.teams.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-white mb-2 lg:mb-3 text-sm lg:text-base">Teams</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3">
                      {tournament.teams.map((team, index) => (
                        <div 
                          key={team._id} 
                          onClick={() => handleTeamClick(team)}
                          className="flex items-center space-x-2 lg:space-x-3 p-2 lg:p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-600/50 transition-colors"
                        >
                          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-600 rounded-full flex items-center justify-center">
                            {team.profile?.avatar ? (
                              <img 
                                src={team.profile.avatar} 
                                alt={team.username}
                                className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-xs lg:text-sm font-bold">
                                {team.username.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white text-sm lg:text-base truncate">
                              {team.profile?.displayName || team.username}
                            </div>
                            <div className="text-xs text-gray-400 truncate">@{team.username}</div>
                          </div>
                          <div className="text-gray-400 text-xs">
                            Click to view members
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {((tournament.format === 'Solo' && tournament.participants.length === 0) || 
                  (tournament.format === 'Duo' && tournament.teams.length === 0)) && (
                  <div className="text-center py-6 lg:py-8">
                    <Users className="h-10 w-10 lg:h-12 lg:w-12 text-gray-400 mx-auto mb-3 lg:mb-4" />
                    <h4 className="text-base lg:text-lg font-semibold text-white mb-2">No Participants Yet</h4>
                    <p className="text-gray-400 text-sm lg:text-base">Participants will appear here once they join the tournament</p>
                  </div>
                )}
              </div>

              {/* Prize Pool */}
              {tournament.prizePoolType === 'with_prize' && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
                  <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4 flex items-center">
                    <Crown className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-yellow-400" />
                    Prize Pool
                  </h3>
                  <div className="text-center">
                    <div className="text-2xl lg:text-4xl font-bold text-yellow-400 mb-2">
                      ₹{tournament.prizePool.toLocaleString()}
                    </div>
                    <p className="text-gray-400 text-sm lg:text-base">Total Prize Pool</p>
                    {tournament.entryFee > 0 && (
                      <p className="text-xs lg:text-sm text-gray-500 mt-2">
                        Entry Fee: ₹{tournament.entryFee}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Rules */}
              {tournament.rules && tournament.rules.length > 0 && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
                  <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4">Tournament Rules</h3>
                  <ul className="space-y-2">
                    {tournament.rules.map((rule, index) => (
                      <li key={index} className="flex items-start space-x-2 text-xs lg:text-sm text-gray-300">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4 lg:space-y-6">
              {/* Join/Leave Button */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
                <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4">Participation</h3>
                
                {tournament.status === 'Registration Open' ? (
                  (tournament.format === 'Solo' || tournament.format === 'Duo') ? (
                    isParticipant() ? (
                      <button
                        onClick={() => setShowLeaveDialog(true)}
                        className="w-full bg-red-600 text-white font-bold py-2 lg:py-3 px-3 lg:px-4 rounded-lg hover:bg-red-700 transition-colors text-sm lg:text-base"
                      >
                        Leave Tournament
                      </button>
                    ) : (
                      <button
                        onClick={handleJoinTournament}
                        className="w-full bg-blue-600 text-white font-bold py-2 lg:py-3 px-3 lg:px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm lg:text-base"
                      >
                        {tournament.format === 'Solo' ? 'Join Tournament' : 'Create Duo Team'}
                      </button>
                    )
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-sm text-gray-400 mb-2">Squad Tournament</div>
                      <button 
                        onClick={() => setShowTeamOnlyDialog(true)}
                        className="text-xs text-orange-400 hover:text-orange-300 underline transition-colors"
                      >
                        Only teams can join this tournament
                      </button>
                    </div>
                  )
                ) : tournament.status === 'Upcoming' ? (
                  <button
                    disabled
                    className="w-full bg-gray-600 text-gray-300 font-bold py-2 lg:py-3 px-3 lg:px-4 rounded-lg cursor-not-allowed text-sm lg:text-base"
                  >
                    Registration Not Open
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-600 text-gray-300 font-bold py-2 lg:py-3 px-3 lg:px-4 rounded-lg cursor-not-allowed text-sm lg:text-base"
                  >
                    Registration Closed
                  </button>
                )}

                <div className="mt-3 lg:mt-4 text-xs lg:text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Participants:</span>
                    <span>{
                      tournament.format === 'Solo' 
                        ? tournament.participants.length + tournament.teams.length 
                        : tournament.teams.length
                    }/{tournament.totalSlots}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Format:</span>
                    <span>{tournament.format}</span>
                  </div>
                </div>
              </div>

              {/* Host Info */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
                <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4">Tournament Host</h3>
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-600 rounded-full flex items-center justify-center">
                    {tournament.host.profile?.avatar ? (
                      <img 
                        src={tournament.host.profile.avatar} 
                        alt={tournament.host.username}
                        className="w-10 h-10 lg:w-12 lg:h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm lg:text-lg font-bold">
                        {tournament.host.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm lg:text-base truncate">
                      {tournament.host.profile?.displayName || tournament.host.username}
                    </div>
                    <div className="text-xs lg:text-sm text-gray-400 truncate">@{tournament.host.username}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'results' && (
          <div className="space-y-4 lg:space-y-6">
            {/* Final Results - Winner & Runner-up */}
            {tournament.status === 'Completed' && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
                <h3 className="text-base lg:text-lg font-semibold text-white mb-4 lg:mb-6 flex items-center">
                  <Trophy className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-yellow-400" />
                  Final Results
                </h3>
                
                <div className="space-y-3 lg:space-y-4">
                  {/* Winner */}
                  <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30 rounded-lg p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 lg:space-x-4">
                        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
                          <Trophy className="h-6 w-6 lg:h-8 lg:w-8 text-yellow-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs lg:text-sm text-yellow-400 font-medium">WINNER</div>
                          <div className="text-lg lg:text-xl font-bold text-white truncate">
                            {tournament.winner?.profile?.displayName || tournament.winner?.username || 'TBD'}
                          </div>
                          <div className="text-xs lg:text-sm text-gray-400 truncate">
                            @{tournament.winner?.username || 'TBD'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl lg:text-2xl font-bold text-yellow-400">1st</div>
                        {tournament.prizePoolType === 'with_prize' && tournament.prizePool > 0 && (
                          <div className="text-xs lg:text-sm text-gray-400">
                            Prize: ₹{Math.floor(tournament.prizePool * 0.6).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Runner-up */}
                  <div className="bg-gradient-to-r from-gray-500/10 to-gray-600/10 border border-gray-500/30 rounded-lg p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 lg:space-x-4">
                        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gray-500/20 rounded-full flex items-center justify-center">
                          <Trophy className="h-6 w-6 lg:h-8 lg:w-8 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs lg:text-sm text-gray-400 font-medium">RUNNER-UP</div>
                          <div className="text-lg lg:text-xl font-bold text-white truncate">
                            {tournament.runnerUp?.profile?.displayName || tournament.runnerUp?.username || 'TBD'}
                          </div>
                          <div className="text-xs lg:text-sm text-gray-400 truncate">
                            @{tournament.runnerUp?.username || 'TBD'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl lg:text-2xl font-bold text-gray-400">2nd</div>
                        {tournament.prizePoolType === 'with_prize' && tournament.prizePool > 0 && (
                          <div className="text-xs lg:text-sm text-gray-400">
                            Prize: ₹{Math.floor(tournament.prizePool * 0.3).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Third Place */}
                  {tournament.thirdPlace && (
                    <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-lg p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 lg:space-x-4">
                          <div className="w-12 h-12 lg:w-16 lg:h-16 bg-orange-500/20 rounded-full flex items-center justify-center">
                            <Trophy className="h-6 w-6 lg:h-8 lg:w-8 text-orange-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs lg:text-sm text-orange-400 font-medium">THIRD PLACE</div>
                            <div className="text-lg lg:text-xl font-bold text-white truncate">
                              {tournament.thirdPlace?.profile?.displayName || tournament.thirdPlace?.username || 'TBD'}
                            </div>
                            <div className="text-xs lg:text-sm text-gray-400 truncate">
                              @{tournament.thirdPlace?.username || 'TBD'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl lg:text-2xl font-bold text-orange-400">3rd</div>
                          {tournament.prizePoolType === 'with_prize' && tournament.prizePool > 0 && (
                            <div className="text-xs lg:text-sm text-gray-400">
                              Prize: ₹{Math.floor(tournament.prizePool * 0.1).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tournament Status */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
              <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4 flex items-center">
                <Trophy className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-yellow-400" />
                Tournament Status
              </h3>
              
              {tournament.status === 'Completed' ? (
                <div className="text-center py-6 lg:py-8">
                  <Trophy className="h-12 w-12 lg:h-16 lg:w-16 text-yellow-400 mx-auto mb-3 lg:mb-4" />
                  <h4 className="text-lg lg:text-xl font-bold text-white mb-2">Tournament Completed</h4>
                  <p className="text-gray-400 text-sm lg:text-base">Final results are displayed above</p>
                </div>
              ) : tournament.status === 'Ended' ? (
                <div className="text-center py-6 lg:py-8">
                  <XCircle className="h-12 w-12 lg:h-16 lg:w-16 text-red-400 mx-auto mb-3 lg:mb-4" />
                  <h4 className="text-lg lg:text-xl font-bold text-white mb-2">Tournament Ended</h4>
                  <p className="text-gray-400 text-sm lg:text-base">Tournament has been ended by the host</p>
                </div>
              ) : tournament.status === 'Ongoing' ? (
                <div className="text-center py-6 lg:py-8">
                  <Clock className="h-12 w-12 lg:h-16 lg:w-16 text-blue-400 mx-auto mb-3 lg:mb-4" />
                  <h4 className="text-lg lg:text-xl font-bold text-white mb-2">Tournament in Progress</h4>
                  <p className="text-gray-400 text-sm lg:text-base">Results will be updated as matches complete</p>
                </div>
              ) : (
                <div className="text-center py-6 lg:py-8">
                  <Calendar className="h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mx-auto mb-3 lg:mb-4" />
                  <h4 className="text-lg lg:text-xl font-bold text-white mb-2">Tournament Not Started</h4>
                  <p className="text-gray-400 text-sm lg:text-base">Results will appear here once the tournament begins</p>
                </div>
              )}
            </div>

            {/* Round-wise Standings */}
            {tournament.groupResults && tournament.groupResults.length > 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
                <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4 flex items-center">
                  <Users className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-blue-400" />
                  Round-wise Standings
                </h3>
                
                <div className="space-y-4 lg:space-y-6">
                  {tournament.groupResults.map((groupResult, index) => {
                    const isFinalRound = groupResult.round === tournament.totalRounds;
                    
                    return (
                      <div key={index} className="bg-gray-700/50 rounded-lg p-3 lg:p-4">
                        <h4 className="font-semibold text-white mb-2 lg:mb-3 text-sm lg:text-base">
                          Round {groupResult.round} - {groupResult.groupName}
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs lg:text-sm">
                            <thead>
                              <tr className="border-b border-gray-600">
                                <th className="text-left py-1 lg:py-2 text-gray-400">Rank</th>
                                <th className="text-left py-1 lg:py-2 text-gray-400">Team</th>
                                <th className="text-center py-1 lg:py-2 text-gray-400">Wins</th>
                                <th className="text-center py-1 lg:py-2 text-gray-400">Points</th>
                                <th className="text-center py-1 lg:py-2 text-gray-400">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {groupResult.teams.map((team, teamIndex) => {
                                let statusText = '';
                                let statusColor = '';
                                
                                if (isFinalRound) {
                                  // Final round - show winner, runner-up, etc.
                                  if (team.rank === 1) {
                                    statusText = 'Winner';
                                    statusColor = 'bg-yellow-500/20 text-yellow-400';
                                  } else if (team.rank === 2) {
                                    statusText = 'Runner-up';
                                    statusColor = 'bg-gray-500/20 text-gray-400';
                                  } else if (team.rank === 3) {
                                    statusText = '2nd Runner-up';
                                    statusColor = 'bg-orange-500/20 text-orange-400';
                                  } else {
                                    statusText = 'Eliminated';
                                    statusColor = 'bg-red-500/20 text-red-400';
                                  }
                                } else {
                                  // Earlier rounds - show qualified/eliminated
                                  statusText = team.qualified ? 'Qualified' : 'Eliminated';
                                  statusColor = team.qualified ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400';
                                }
                                
                                return (
                                  <tr key={teamIndex} className="border-b border-gray-600/50">
                                    <td className="py-1 lg:py-2">
                                      <span className={`px-1 lg:px-2 py-1 rounded text-xs ${
                                        team.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                                        team.rank === 2 ? 'bg-gray-500/20 text-gray-400' :
                                        team.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                                        'bg-gray-600/20 text-gray-300'
                                      }`}>
                                        #{team.rank}
                                      </span>
                                    </td>
                                    <td className="py-1 lg:py-2">
                                      <div className="flex items-center space-x-1 lg:space-x-2">
                                        {team.teamLogo && (
                                          <img 
                                            src={team.teamLogo} 
                                            alt={team.teamName}
                                            className="w-4 h-4 lg:w-6 lg:h-6 rounded-full object-cover"
                                          />
                                        )}
                                        <span className="font-medium text-white text-xs lg:text-sm truncate">{team.teamName}</span>
                                      </div>
                                    </td>
                                    <td className="text-center py-1 lg:py-2 text-white text-xs lg:text-sm">{team.wins}</td>
                                    <td className="text-center py-1 lg:py-2 text-white text-xs lg:text-sm">{team.totalPoints}</td>
                                    <td className="text-center py-1 lg:py-2">
                                      <span className={`px-1 lg:px-2 py-1 rounded text-xs ${statusColor}`}>
                                        {statusText}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed Matches */}
            {tournament.matches && tournament.matches.filter(m => m.status === 'Completed').length > 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
                <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4 flex items-center">
                  <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-green-400" />
                  Completed Matches
                </h3>
                
                <div className="space-y-3 lg:space-y-4">
                  {tournament.matches
                    .filter(match => match.status === 'Completed')
                    .slice(0, 10) // Show only recent 10 matches
                    .map((match, index) => (
                    <div key={index} className="bg-gray-700/50 rounded-lg p-3 lg:p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs lg:text-sm text-gray-400">Round {match.round}</span>
                        <span className="text-xs text-green-400">Completed</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 lg:space-x-3 flex-1 min-w-0">
                          <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gray-600 rounded-full flex items-center justify-center">
                            {match.team1?.profile?.avatar ? (
                              <img 
                                src={match.team1.profile.avatar} 
                                alt={match.team1.username}
                                className="w-6 h-6 lg:w-8 lg:h-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-bold">
                                {match.team1?.username?.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="font-medium text-white text-xs lg:text-sm truncate">
                            {match.team1?.profile?.displayName || match.team1?.username}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 lg:space-x-4 mx-2">
                          <span className="text-sm lg:text-lg font-bold text-white">
                            {match.result?.team1Score || 0}
                          </span>
                          <span className="text-gray-400 text-xs lg:text-sm">-</span>
                          <span className="text-sm lg:text-lg font-bold text-white">
                            {match.result?.team2Score || 0}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 lg:space-x-3 flex-1 min-w-0 justify-end">
                          <span className="font-medium text-white text-xs lg:text-sm truncate">
                            {match.team2?.profile?.displayName || match.team2?.username}
                          </span>
                          <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gray-600 rounded-full flex items-center justify-center">
                            {match.team2?.profile?.avatar ? (
                              <img 
                                src={match.team2.profile.avatar} 
                                alt={match.team2.username}
                                className="w-6 h-6 lg:w-8 lg:h-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-bold">
                                {match.team2?.username?.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Duo Team Creation Modal */}
        {showTeamModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Create Duo Team</h3>
                <button
                  onClick={() => {
                    setShowTeamModal(false);
                    setTeamName('');
                    setSelectedFollower(null);
                    setSearchQuery('');
                    setFollowers([]);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Team Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Follower Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Add Teammate
                  </label>
                  <div className="relative">
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            const value = e.target.value;
                            setSearchQuery(value);
                            
                            // Clear existing timeout
                            if (searchTimeout) {
                              clearTimeout(searchTimeout);
                            }
                            
                            // Set new timeout for debounced search
                            const timeout = setTimeout(() => {
                              searchFollowers(value);
                            }, 300); // 300ms delay
                            
                            setSearchTimeout(timeout);
                          }}
                          placeholder="Search followers..."
                          className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Search Results */}
                    {searchQuery && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                        {searchLoading ? (
                          <div className="p-3 text-center text-gray-400">Searching...</div>
                        ) : followers.length > 0 ? (
                          followers.map((follower) => (
                            <button
                              key={follower._id}
                              onClick={() => {
                                setSelectedFollower(follower);
                                setSearchQuery(follower.username);
                                setFollowers([]);
                              }}
                              className="w-full p-3 text-left hover:bg-gray-600 flex items-center space-x-3"
                            >
                              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                {follower.profile?.avatar ? (
                                  <img 
                                    src={follower.profile.avatar} 
                                    alt={follower.username}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-bold">
                                    {follower.username.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-white text-sm">
                                  {follower.profile?.displayName || follower.username}
                                </div>
                                <div className="text-xs text-gray-400">@{follower.username}</div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-3 text-center text-gray-400">No followers found</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Teammate */}
                  {selectedFollower && (
                    <div className="mt-2 p-3 bg-gray-700/50 rounded-lg flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                          {selectedFollower.profile?.avatar ? (
                            <img 
                              src={selectedFollower.profile.avatar} 
                              alt={selectedFollower.username}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold">
                              {selectedFollower.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white text-sm">
                            {selectedFollower.profile?.displayName || selectedFollower.username}
                          </div>
                          <div className="text-xs text-gray-400">@{selectedFollower.username}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFollower(null);
                          setSearchQuery('');
                        }}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowTeamModal(false);
                      setTeamName('');
                      setSelectedFollower(null);
                      setSearchQuery('');
                      setFollowers([]);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateDuoTeam}
                    disabled={!teamName.trim() || !selectedFollower}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Create Team</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Members Dialog */}
        {showTeamMembersDialog && selectedTeam && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Team Members</h3>
                  <button
                    onClick={() => setShowTeamMembersDialog(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-2">Team Name</div>
                  <div className="text-white font-medium">{selectedTeam.profile?.displayName || selectedTeam.username}</div>
                  <div className="text-xs text-gray-400">@{selectedTeam.username}</div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-3">Members ({selectedTeam.teamInfo?.members?.length || 0})</div>
                  <div className="space-y-3">
                    {selectedTeam.teamInfo?.members?.map((member: any, index: number) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                          {member.user?.profile?.avatar ? (
                            <img 
                              src={member.user.profile.avatar} 
                              alt={member.user.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-bold">
                              {member.user?.username?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white text-sm">
                            {member.user?.profile?.displayName || member.user?.username || 'Unknown User'}
                          </div>
                          <div className="text-xs text-gray-400">
                            @{member.user?.username || 'unknown'} • {member.role}
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-4 text-gray-400">
                        No members found
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setShowTeamMembersDialog(false)}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Leave Tournament Confirmation Dialog */}
        {showLeaveDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Leave Tournament</h3>
                  <button
                    onClick={() => setShowLeaveDialog(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-300 mb-4">
                    Are you sure you want to leave this tournament? This action cannot be undone.
                  </p>
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-yellow-200 text-sm">
                      <strong>Warning:</strong> If you're part of a duo team, leaving will remove the entire team from the tournament.
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowLeaveDialog(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    disabled={isLeaving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLeaveTournament}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    disabled={isLeaving}
                  >
                    {isLeaving ? 'Leaving...' : 'Leave Tournament'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Only Dialog */}
        {showTeamOnlyDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center mb-4">
                <div className="w-4 h-4 rounded-full mr-3 bg-orange-500"></div>
                <h3 className="text-lg font-semibold text-white">Squad Tournament</h3>
              </div>
              <p className="text-gray-300 mb-6">
                Squad tournaments are team-only events. You need to either join an existing team or create your own team to participate.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowTeamOnlyDialog(false);
                    navigate('/recruitment');
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Find Teams
                </button>
                <button
                  onClick={() => {
                    setShowTeamOnlyDialog(false);
                    setShowLogoutConfirmation(true);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Team
                </button>
                <button
                  onClick={() => setShowTeamOnlyDialog(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Logout Confirmation Dialog */}
        {showLogoutConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center mb-4">
                <div className="w-4 h-4 rounded-full mr-3 bg-yellow-500"></div>
                <h3 className="text-lg font-semibold text-white">Create Team Account</h3>
              </div>
              <p className="text-gray-300 mb-4">
                To create a team, you need to logout from your player profile and create a new team account.
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Instructions */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-300 mb-3 font-medium">You will need to:</p>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">1.</span>
                      <span>Logout from your current player account</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">2.</span>
                      <span>Go to the signup page</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">3.</span>
                      <span>Select "Team" as account type (see image)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">4.</span>
                      <span>Fill in team details and create account</span>
                    </li>
                  </ul>
                </div>
                
                {/* Screenshot */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-300 mb-3 font-medium">Signup Page Preview:</p>
                  <div className="bg-gray-600 rounded-lg p-3 text-center">
                    <img 
                      src="/src/assets/signup-team-selected.png" 
                      alt="Signup page with Team selected"
                      className="w-full h-auto rounded border border-gray-500"
                      onError={(e) => {
                        // Fallback if image doesn't load
                        e.currentTarget.style.display = 'none';
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement) {
                          nextElement.style.display = 'block';
                        }
                      }}
                    />
                    <div className="hidden text-gray-400 text-sm py-8">
                      <div className="bg-gray-500 rounded p-4 mb-2">
                        <div className="text-white font-semibold mb-2">Account Type</div>
                        <div className="flex gap-2">
                          <div className="bg-gray-600 p-2 rounded text-xs">Player</div>
                          <div className="bg-blue-600 border-2 border-red-500 p-2 rounded text-xs text-white font-semibold">Team ✓</div>
                        </div>
                      </div>
                      <p className="text-xs">Select "Team" option</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowLogoutConfirmation(false);
                    // Logout and redirect to signup
                    localStorage.removeItem('token');
                    window.location.href = '/register';
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Logout & Create Team
                </button>
                <button
                  onClick={() => setShowLogoutConfirmation(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentDetail;
