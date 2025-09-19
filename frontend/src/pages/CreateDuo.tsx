import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  UserPlus, 
  Search, 
  X,
  Users,
  Crown,
  Trophy,
  Gamepad2,
  Calendar,
  DollarSign
} from 'lucide-react';
import axios from 'axios';

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
  prizePoolType: string;
}

interface User {
  _id: string;
  username: string;
  profile?: {
    displayName?: string;
    avatar?: string;
  };
}

const CreateDuo: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const tournamentId = searchParams.get('tournamentId');

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Duo team creation state
  const [teamName, setTeamName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [followers, setFollowers] = useState<User[]>([]);
  const [selectedFollower, setSelectedFollower] = useState<User | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (tournamentId) {
      fetchTournament();
    } else {
      setError('Tournament ID not provided');
      setLoading(false);
    }
  }, [tournamentId]);

  // Load followers when component mounts
  useEffect(() => {
    if (user?._id) {
      searchFollowers('');
    }
  }, [user?._id]);

  const fetchTournament = async () => {
    try {
      const response = await axios.get(`/api/tournaments/${tournamentId}`);
      setTournament(response.data.data.tournament);
    } catch (error) {
      console.error('Error fetching tournament:', error);
      setError('Failed to fetch tournament details');
    } finally {
      setLoading(false);
    }
  };

  const searchFollowers = async (query: string) => {
    setSearching(true);
    try {
      // Get all followers of current user
      const followersResponse = await axios.get(`/api/users/${user?._id}/followers`);
      const allFollowers = followersResponse.data.data?.followers || [];
      
      if (!query.trim()) {
        // Show all followers when search is empty
        setFollowers(allFollowers);
      } else {
        // Filter by search query
        const filteredFollowers = allFollowers.filter((follower: User) => 
          follower.username.toLowerCase().includes(query.toLowerCase()) ||
          (follower.profile?.displayName && follower.profile.displayName.toLowerCase().includes(query.toLowerCase()))
        );
        setFollowers(filteredFollowers);
      }
    } catch (error) {
      console.error('Error searching followers:', error);
      setFollowers([]);
    } finally {
      setSearching(false);
    }
  };

  const handleCreateDuoTeam = async () => {
    if (!teamName.trim() || !selectedFollower || !tournamentId) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Create duo team and join tournament
      const teamResponse = await axios.post('/api/users/create-team', {
        username: teamName,
        teamType: 'duo',
        members: [selectedFollower._id],
        game: tournament.game,
        tournamentId: tournamentId
      }, {
        timeout: 10000 // 10 second timeout
      });

      setSuccess('Duo team created and joined tournament successfully!');
      setTimeout(() => {
        // Force refresh by adding timestamp to URL
        navigate(`/tournament/${tournamentId}?refresh=${Date.now()}`);
      }, 2000);
    } catch (error: any) {
      console.error('Error creating duo team:', error);
      
      if (error.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again.');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.data?.errors) {
        setError(error.response.data.errors.join(', '));
      } else {
        setError('Failed to create duo team. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getGameIcon = (game: string) => {
    const icons: { [key: string]: string } = {
      'BGMI': '🎮',
      'Valorant': '🔫',
      'Free Fire': '💥',
      'Call of Duty Mobile': '⚔️'
    };
    return icons[game] || '🎮';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading tournament details...</p>
        </div>
      </div>
    );
  }

  if (error && !tournament) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center px-4">
          <X className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/tournaments')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-4 md:pt-20 lg:pt-20 pb-16 lg:pb-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <button
            onClick={() => navigate('/tournaments')}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4 lg:mb-6"
          >
            <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5" />
            <span className="text-sm lg:text-base">Back to Tournaments</span>
          </button>
          
          <div className="flex items-center space-x-3 mb-4">
            <Trophy className="h-7 w-7 lg:h-8 lg:w-8 text-gray-400" />
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Create Duo Team</h1>
          </div>
          <p className="text-gray-400 text-sm lg:text-base">Create a duo team to join this tournament</p>
        </div>

        {/* Tournament Info */}
        {tournament && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 lg:p-6 mb-6">
            <div className="flex items-start space-x-4">
              <div className="text-3xl lg:text-4xl">
                {getGameIcon(tournament.game)}
              </div>
              <div className="flex-1">
                <h2 className="text-xl lg:text-2xl font-bold text-white mb-2">{tournament.name}</h2>
                <p className="text-gray-400 text-sm lg:text-base mb-3">{tournament.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm lg:text-base text-gray-400">
                  <span className="flex items-center space-x-1">
                    <Gamepad2 className="h-4 w-4" />
                    <span>{tournament.game} • {tournament.mode || 'Battle Royale'} • {tournament.format}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(tournament.startDate)}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4" />
                    <span>{tournament.prizePoolType === 'with_prize' ? `₹${tournament.prizePool.toLocaleString()}` : 'Free Entry'}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-red-400">
              <X className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-green-400">
              <Trophy className="h-5 w-5" />
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Duo Team Creation Form */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 lg:p-6">
          <h3 className="text-lg lg:text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Create Your Duo Team</span>
          </h3>

          <div className="space-y-6">
            {/* Team Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Team Name *
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter your duo team name"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              />
            </div>

            {/* Partner Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Your Duo Partner *
              </label>
              
              {/* Note about followers only */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-blue-300 text-sm">
                    <strong>Note:</strong> You can only add your followers as duo partners for this tournament. 
                    Make sure to follow the player you want to team up with before creating the duo team.
                  </p>
                </div>
              </div>
              
              <div className="relative">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-400 absolute left-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchFollowers(e.target.value);
                    }}
                    onFocus={() => {
                      if (selectedFollower) {
                        setSelectedFollower(null);
                        setSearchQuery('');
                        searchFollowers('');
                      }
                    }}
                    placeholder="Search your followers to invite as duo partner"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                  />
                </div>

                {/* Search Results */}
                {!selectedFollower && (searchQuery || followers.length > 0) && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {searching ? (
                      <div className="p-4 text-center text-gray-400">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        {searchQuery ? 'Searching...' : 'Loading followers...'}
                      </div>
                    ) : followers.length > 0 ? (
                      <>
                        {!searchQuery && (
                          <div className="p-3 text-xs text-gray-400 border-b border-gray-600">
                            Your followers ({followers.length})
                          </div>
                        )}
                        {followers.map((follower) => (
                          <button
                            key={follower._id}
                            onClick={() => {
                              setSelectedFollower(follower);
                              setSearchQuery(follower.username);
                              setFollowers([]);
                            }}
                            className="w-full p-4 text-left hover:bg-gray-600 transition-colors border-b border-gray-600 last:border-b-0"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {follower.profile?.displayName?.[0] || follower.username[0].toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-white font-medium">{follower.username}</p>
                                {follower.profile?.displayName && (
                                  <p className="text-gray-400 text-sm">{follower.profile.displayName}</p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="p-4 text-center text-gray-400">
                        <div className="text-sm mb-1">No followers found</div>
                        <div className="text-xs text-gray-500">Make sure to follow the player first</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Partner */}
              {selectedFollower && (
                <div className="mt-4 p-4 bg-gray-700 rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {selectedFollower.profile?.displayName?.[0] || selectedFollower.username[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{selectedFollower.username}</p>
                        {selectedFollower.profile?.displayName && (
                          <p className="text-gray-400 text-sm">{selectedFollower.profile.displayName}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFollower(null);
                        setSearchQuery('');
                      }}
                      className="p-1 hover:bg-gray-600 rounded-full transition-colors"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={() => navigate('/tournaments')}
                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDuoTeam}
                disabled={!teamName.trim() || !selectedFollower || loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating Team...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Create Duo Team & Join</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateDuo;
