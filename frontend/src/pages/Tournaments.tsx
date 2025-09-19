import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Trophy, 
  Search, 
  Filter, 
  Plus, 
  Users, 
  Calendar, 
  DollarSign,
  Gamepad2,
  Crown,
  Star,
  Home,
  Briefcase,
  User
} from 'lucide-react';
import axios from 'axios';
import CreateTournamentModal from '../components/CreateTournamentModal';
import MobileBottomNav from '../components/MobileBottomNav';
import TournamentManagementModal from '../components/TournamentManagementModal';
import CustomDialog from '../components/CustomDialog';

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
  participants: any[];
  teams: any[];
  host: {
    _id: string;
    username: string;
    profile?: {
      displayName?: string;
      avatar?: string;
    };
  };
  createdAt: string;
}

const Tournaments: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [tournamentFilter, setTournamentFilter] = useState('All Tournaments');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  
  // Custom dialog state
  const [customDialog, setCustomDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const [showTeamOnlyDialog, setShowTeamOnlyDialog] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, [activeFilter, searchQuery]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (activeFilter !== 'all') {
        if (activeFilter === 'available') {
          params.append('status', 'Registration Open');
        } else if (activeFilter === 'recent') {
          // For recent, we'll filter on frontend since backend doesn't support multiple statuses
          // We'll fetch all and filter on frontend
        } else {
          params.append('filter', activeFilter);
        }
      }

      const response = await axios.get(`/api/tournaments?${params}`);
      setTournaments(response.data.data.tournaments || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTournamentCreated = () => {
    fetchTournaments();
  };

  const handleManageTournament = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setShowManagementModal(true);
  };

  const handleViewTournament = (tournament: Tournament) => {
    navigate(`/tournament/${tournament._id}`);
  };

  const handleTournamentUpdated = () => {
    fetchTournaments();
  };

  const showDialog = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setCustomDialog({
      isOpen: true,
      title,
      message,
      type
    });
  };

  const closeDialog = () => {
    setCustomDialog(prev => ({ ...prev, isOpen: false }));
  };

  const joinTournament = async (tournamentId: string, tournamentFormat?: string) => {
    try {
      console.log('Attempting to join tournament:', {
        tournamentId,
        user: user,
        userType: user?.role,
        format: tournamentFormat
      });
      
      // For duo tournaments, redirect to create duo page
      if (tournamentFormat === 'Duo') {
        navigate(`/create-duo?tournamentId=${tournamentId}`);
        return;
      }
      
      await axios.post(`/api/tournaments/${tournamentId}/join`);
      // Refresh tournaments to update the UI
      fetchTournaments();
      // Show success message
      showDialog('Success!', 'Successfully joined tournament!', 'success');
    } catch (error: any) {
      console.error('Error joining tournament:', error);
      showDialog('Error', error.response?.data?.message || 'Failed to join tournament', 'error');
    }
  };

  const leaveTournament = async (tournamentId: string) => {
    try {
      await axios.post(`/api/tournaments/${tournamentId}/leave`);
      // Refresh tournaments to update the UI
      fetchTournaments();
      // Show success message
      showDialog('Success!', 'Successfully left tournament!', 'success');
    } catch (error: any) {
      console.error('Error leaving tournament:', error);
      showDialog('Error', error.response?.data?.message || 'Failed to leave tournament', 'error');
    }
  };

  const openRegistration = async (tournamentId: string) => {
    try {
      await axios.put(`/api/tournaments/${tournamentId}`, { status: 'Registration Open' });
      fetchTournaments();
      showDialog('Success!', 'Registration opened successfully!', 'success');
    } catch (error: any) {
      console.error('Error opening registration:', error);
      showDialog('Error', error.response?.data?.message || 'Failed to open registration', 'error');
    }
  };

  const getTotalParticipants = (tournament: Tournament) => {
    // For duo tournaments, only count teams (not individual participants)
    // For solo tournaments, count both individual participants and teams
    return tournament.format === 'Solo' 
      ? tournament.participants.length + tournament.teams.length 
      : tournament.teams.length;
  };

  const isParticipating = (tournament: Tournament) => {
    if (!user) return false;
    
    // Check if user is individual participant
    if (tournament.participants.some(p => p._id === user._id)) {
      return true;
    }
    
    // Check if user is a team that joined the tournament
    if (tournament.teams.some(team => team._id === user._id)) {
      return true;
    }
    
    // Check if user is part of any team
    if (tournament.teams.some(team => 
      team.teamInfo?.members?.some(member => 
        (typeof member.user === 'string' ? member.user : member.user._id) === user._id
      )
    )) {
      return true;
    }
    
    return false;
  };

  const isHost = (tournament: Tournament) => {
    if (!user) return false;
    return tournament.host._id === user._id;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Registration Open': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Ongoing': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Completed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-secondary-800/50 text-secondary-300 border-secondary-700/50';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getActionButton = (tournament: Tournament) => {
    if (isHost(tournament)) {
      if (tournament.status === 'Upcoming') {
        return (
          <button
            onClick={() => openRegistration(tournament._id)}
            className="w-full px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors text-sm lg:text-base font-medium"
          >
            Open Registration
          </button>
        );
      }
      return null; // No additional button needed for hosts
    }

    if (isParticipating(tournament)) {
      return (
        <button 
          onClick={() => leaveTournament(tournament._id)}
          className="w-full px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm lg:text-base font-medium"
        >
          Leave Tournament
        </button>
      );
    }

    if (tournament.status !== 'Registration Open') {
      return (
        <button className="w-full px-4 py-2 bg-gray-700 text-gray-300 rounded-lg cursor-not-allowed text-sm lg:text-base font-medium">
          Registration Closed
        </button>
      );
    }

    // Check if player is trying to join team-only tournaments
    if (user?.role === 'player' && (tournament.format === 'Squad' || tournament.format === '5v5')) {
      return (
        <button 
          onClick={() => setShowTeamOnlyDialog(true)}
          className="w-full px-4 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg hover:bg-orange-500/30 transition-colors text-sm lg:text-base font-medium"
        >
          Team Only
        </button>
      );
    }

    return (
              <button 
          onClick={() => joinTournament(tournament._id, tournament.format)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm lg:text-base font-medium"
        >
          Join Tournament
        </button>
    );
  };

  // Categorize tournaments based on active filter
  const getFilteredTournaments = () => {
    if (activeFilter === 'available') {
      return tournaments.filter(t => t.status === 'Registration Open');
    } else if (activeFilter === 'recent') {
      return tournaments.filter(t => 
        t.status === 'Ongoing' || t.status === 'Completed' || t.status === 'Cancelled'
      );
    } else if (activeFilter === 'participating') {
      return tournaments.filter(isParticipating);
    } else if (activeFilter === 'hosted') {
      return tournaments.filter(isHost);
    }
    return tournaments;
  };

  const filteredTournaments = getFilteredTournaments();
  
  // For display in "All" view, use original tournaments
  const availableTournaments = tournaments.filter(t => t.status === 'Registration Open');
  const recentTournaments = tournaments.filter(t => 
    t.status === 'Ongoing' || t.status === 'Completed' || t.status === 'Cancelled'
  );

  // Calculate counts from original tournament list (not filtered)
  const allTournaments = tournaments; // Use original list for counts
  const allAvailableTournaments = allTournaments.filter(t => t.status === 'Registration Open');
  const allRecentTournaments = allTournaments.filter(t => 
    t.status === 'Ongoing' || t.status === 'Completed' || t.status === 'Cancelled'
  );

  const filterOptions = [
    { key: 'all', label: 'All', count: allTournaments.length },
    { key: 'available', label: 'Available', count: allAvailableTournaments.length },
    { key: 'recent', label: 'Recent', count: allRecentTournaments.length },
    { key: 'participating', label: 'Participating', count: allTournaments.filter(isParticipating).length },
    { key: 'hosted', label: 'Hosted', count: allTournaments.filter(isHost).length }
  ];

  return (
    <div className="min-h-screen bg-black pt-4 md:pt-20 lg:pt-20 pb-16 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Trophy className="h-7 w-7 lg:h-8 lg:w-8 text-gray-400" />
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Tournaments</h1>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700 text-sm lg:text-base"
            >
              <Plus className="h-4 w-4 lg:h-5 lg:w-5" />
              <span className="hidden sm:inline">Create Tournament</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>
          <p className="text-gray-400 text-sm lg:text-base">Compete in epic tournaments and win amazing prizes.</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-gray-800 rounded-lg p-4 lg:p-6 mb-6 lg:mb-8 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tournaments..."
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 text-sm lg:text-base"
              />
            </div>
            <select
              value={tournamentFilter}
              onChange={(e) => setTournamentFilter(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 text-sm lg:text-base"
            >
              <option>All Tournaments</option>
              <option>BGMI</option>
              <option>Valorant</option>
              <option>Free Fire</option>
              <option>Call of Duty Mobile</option>
            </select>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setActiveFilter(option.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === option.key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>
        </div>

        {/* Tournaments Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading tournaments...</p>
          </div>
        ) : (activeFilter === 'all' ? tournaments.length > 0 : filteredTournaments.length > 0) ? (
          <div className="space-y-8">
            {/* Show sections based on active filter */}
            {activeFilter === 'all' && (
              <>
                {/* Available Tournaments Section */}
                {availableTournaments.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Available Tournaments
                      </h2>
                      <span className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                        {availableTournaments.length} tournament{availableTournaments.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                      {availableTournaments.map((tournament) => (
                        <div key={tournament._id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors">
                          {/* Tournament Image */}
                          <div className="relative h-32 lg:h-36 bg-gray-700">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            
                            {/* Status Tags */}
                            <div className="absolute top-3 left-3 flex gap-2">
                              <span className={`${tournament.prizePoolType === 'with_prize' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'} border px-2 py-1 rounded text-xs font-medium`}>
                                {tournament.prizePoolType === 'with_prize' ? 'Prize' : 'Fun'}
                              </span>
                              <span className={`${getStatusColor(tournament.status)} px-2 py-1 rounded text-xs font-medium`}>
                                {tournament.status}
                              </span>
                            </div>

                            {/* Game Icon */}
                            <div className="absolute bottom-3 left-3 text-2xl lg:text-3xl">
                              {getGameIcon(tournament.game)}
                            </div>
                          </div>

                          {/* Tournament Info */}
                          <div className="p-4 lg:p-5">
                            <h3 className="font-bold text-white text-base lg:text-lg mb-2 line-clamp-1">{tournament.name}</h3>
                            <p className="text-gray-400 text-sm lg:text-base mb-3">
                              {tournament.game} {tournament.mode ? `• ${tournament.mode}` : ''} • {tournament.format}
                            </p>

                            {/* Prize Pool */}
                            <div className="text-lg lg:text-xl font-bold text-white mb-3">
                              {tournament.prizePoolType === 'with_prize' ? `₹${tournament.prizePool.toLocaleString()}` : 'Free Entry'}
                            </div>

                            {/* Stats */}
                            <div className="flex items-center justify-between text-sm lg:text-base text-gray-400 mb-4">
                              <span>{getTotalParticipants(tournament)}/{tournament.totalSlots} participants</span>
                              <span>{formatDate(tournament.startDate)}</span>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2">
                              {isHost(tournament) ? (
                                <button
                                  onClick={() => handleViewTournament(tournament)}
                                  className="w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm lg:text-base"
                                >
                                  Manage Tournament
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleViewTournament(tournament)}
                                  className="w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm lg:text-base"
                                >
                                  View Tournament
                                </button>
                              )}
                              {getActionButton(tournament) && (
                                <div className="flex justify-center">
                                  {getActionButton(tournament)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Tournaments Section */}
                {recentTournaments.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        Recent Tournaments
                      </h2>
                      <span className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                        {recentTournaments.length} tournament{recentTournaments.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                      {recentTournaments.map((tournament) => (
                        <div key={tournament._id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors">
                          {/* Tournament Image */}
                          <div className="relative h-32 lg:h-36 bg-gray-700">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            
                            {/* Status Tags */}
                            <div className="absolute top-3 left-3 flex gap-2">
                              <span className={`${tournament.prizePoolType === 'with_prize' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'} border px-2 py-1 rounded text-xs font-medium`}>
                                {tournament.prizePoolType === 'with_prize' ? 'Prize' : 'Fun'}
                              </span>
                              <span className={`${getStatusColor(tournament.status)} px-2 py-1 rounded text-xs font-medium`}>
                                {tournament.status}
                              </span>
                            </div>

                            {/* Game Icon */}
                            <div className="absolute bottom-3 left-3 text-2xl lg:text-3xl">
                              {getGameIcon(tournament.game)}
                            </div>
                          </div>

                          {/* Tournament Info */}
                          <div className="p-4 lg:p-5">
                            <h3 className="font-bold text-white text-base lg:text-lg mb-2 line-clamp-1">{tournament.name}</h3>
                            <p className="text-gray-400 text-sm lg:text-base mb-3">
                              {tournament.game} {tournament.mode ? `• ${tournament.mode}` : ''} • {tournament.format}
                            </p>

                            {/* Prize Pool */}
                            <div className="text-lg lg:text-xl font-bold text-white mb-3">
                              {tournament.prizePoolType === 'with_prize' ? `₹${tournament.prizePool.toLocaleString()}` : 'Free Entry'}
                            </div>

                            {/* Stats */}
                            <div className="flex items-center justify-between text-sm lg:text-base text-gray-400 mb-4">
                              <span>{getTotalParticipants(tournament)}/{tournament.totalSlots} participants</span>
                              <span>{formatDate(tournament.startDate)}</span>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2">
                              {isHost(tournament) ? (
                                <button
                                  onClick={() => handleViewTournament(tournament)}
                                  className="w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm lg:text-base"
                                >
                                  Manage Tournament
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleViewTournament(tournament)}
                                  className="w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm lg:text-base"
                                >
                                  View Tournament
                                </button>
                              )}
                              {getActionButton(tournament) && (
                                <div className="flex justify-center">
                                  {getActionButton(tournament)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Tournaments Section (for tournaments that don't fit Available or Recent) */}
                {(() => {
                  const otherTournaments = tournaments.filter(t => 
                    t.status !== 'Registration Open' && 
                    t.status !== 'Ongoing' && 
                    t.status !== 'Completed' && 
                    t.status !== 'Cancelled'
                  );
                  
                  return otherTournaments.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Other Tournaments
                        </h2>
                        <span className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                          {otherTournaments.length} tournament{otherTournaments.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                        {otherTournaments.map((tournament) => (
                          <div key={tournament._id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors">
                            {/* Tournament Image */}
                            <div className="relative h-32 lg:h-36 bg-gray-700">
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                              
                              {/* Status Tags */}
                              <div className="absolute top-3 left-3 flex gap-2">
                                <span className={`${tournament.prizePoolType === 'with_prize' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'} border px-2 py-1 rounded text-xs font-medium`}>
                                  {tournament.prizePoolType === 'with_prize' ? 'Prize' : 'Fun'}
                                </span>
                                <span className={`${getStatusColor(tournament.status)} px-2 py-1 rounded text-xs font-medium`}>
                                  {tournament.status}
                                </span>
                              </div>

                              {/* Game Icon */}
                              <div className="absolute bottom-3 left-3 text-2xl lg:text-3xl">
                                {getGameIcon(tournament.game)}
                              </div>
                            </div>

                            {/* Tournament Info */}
                            <div className="p-4 lg:p-5">
                              <h3 className="font-bold text-white text-base lg:text-lg mb-2 line-clamp-1">{tournament.name}</h3>
                              <p className="text-gray-400 text-sm lg:text-base mb-3">
                                {tournament.game} {tournament.mode ? `• ${tournament.mode}` : ''} • {tournament.format}
                              </p>

                              {/* Prize Pool */}
                              <div className="text-lg lg:text-xl font-bold text-white mb-3">
                                {tournament.prizePoolType === 'with_prize' ? `₹${tournament.prizePool.toLocaleString()}` : 'Free Entry'}
                              </div>

                              {/* Stats */}
                              <div className="flex items-center justify-between text-sm lg:text-base text-gray-400 mb-4">
                                <span>{getTotalParticipants(tournament)}/{tournament.totalSlots} participants</span>
                                <span>{formatDate(tournament.startDate)}</span>
                              </div>

                              {/* Action Buttons */}
                              <div className="space-y-2">
                                {isHost(tournament) ? (
                                  <button
                                    onClick={() => handleManageTournament(tournament)}
                                    className="w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm lg:text-base"
                                  >
                                    Manage Tournament
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleViewTournament(tournament)}
                                    className="w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm lg:text-base"
                                  >
                                    View Tournament
                                  </button>
                                )}
                                {getActionButton(tournament) && (
                                  <div className="flex justify-center">
                                    {getActionButton(tournament)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            {/* Show filtered tournaments for specific filters */}
            {activeFilter !== 'all' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {filteredTournaments.map((tournament) => (
              <div key={tournament._id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors">
                {/* Tournament Image */}
                <div className="relative h-32 lg:h-36 bg-gray-700">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  
                  {/* Status Tags */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`${tournament.prizePoolType === 'with_prize' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'} border px-2 py-1 rounded text-xs font-medium`}>
                      {tournament.prizePoolType === 'with_prize' ? 'Prize' : 'Fun'}
                    </span>
                    <span className={`${getStatusColor(tournament.status)} px-2 py-1 rounded text-xs font-medium`}>
                      {tournament.status}
                    </span>
                  </div>

                  {/* Game Icon */}
                  <div className="absolute bottom-3 left-3 text-2xl lg:text-3xl">
                    {getGameIcon(tournament.game)}
                  </div>
                </div>

                {/* Tournament Info */}
                <div className="p-4 lg:p-5">
                  <h3 className="font-bold text-white text-base lg:text-lg mb-2 line-clamp-1">{tournament.name}</h3>
                  <p className="text-gray-400 text-sm lg:text-base mb-3">
                    {tournament.game} {tournament.mode ? `• ${tournament.mode}` : ''} • {tournament.format}
                  </p>

                  {/* Prize Pool */}
                  <div className="text-lg lg:text-xl font-bold text-white mb-3">
                    {tournament.prizePoolType === 'with_prize' ? `₹${tournament.prizePool.toLocaleString()}` : 'Free Entry'}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm lg:text-base text-gray-400 mb-4">
                    <span>{getTotalParticipants(tournament)}/{tournament.totalSlots} participants</span>
                    <span>{formatDate(tournament.startDate)}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {isHost(tournament) ? (
                      <button
                        onClick={() => handleViewTournament(tournament)}
                        className="w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm lg:text-base"
                      >
                        Manage Tournament
                      </button>
                    ) : (
                      <button
                        onClick={() => handleViewTournament(tournament)}
                        className="w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm lg:text-base"
                      >
                        View Tournament
                      </button>
                    )}
                    {getActionButton(tournament) && (
                      <div className="flex justify-center">
                        {getActionButton(tournament)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
              </div>
            )}
          </div>
        ) : (
          <div className="card text-center py-12">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No tournaments found</h3>
            <p className="text-gray-400">Try adjusting your search terms or filters</p>
          </div>
        )}

        {/* Create Tournament Modal */}
        <CreateTournamentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onTournamentCreated={handleTournamentCreated}
        />

        {/* Tournament Management Modal */}
        <TournamentManagementModal
          isOpen={showManagementModal}
          onClose={() => {
            setShowManagementModal(false);
            setSelectedTournament(null);
          }}
          tournament={selectedTournament}
          onTournamentUpdated={handleTournamentUpdated}
        />

        {/* Custom Dialog */}
        <CustomDialog
          isOpen={customDialog.isOpen}
          onClose={closeDialog}
          title={customDialog.title}
          message={customDialog.message}
          type={customDialog.type}
        />

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
                        e.currentTarget.nextElementSibling.style.display = 'block';
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

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default Tournaments;
