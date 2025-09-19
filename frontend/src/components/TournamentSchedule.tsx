import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Play, Edit, Trash, Target, Users, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import RoundScheduleModal from './RoundScheduleModal';
import MatchScheduleModal from './MatchScheduleModal';

interface Match {
  _id?: string;
  round: number;
  groupId: string;
  groupName: string;
  team1?: {
    _id: string;
    username: string;
    profile?: {
      displayName: string;
      avatar: string;
    };
  };
  team2?: {
    _id: string;
    username: string;
    profile?: {
      displayName: string;
      avatar: string;
    };
  };
  winner?: {
    _id: string;
    username: string;
    profile?: {
      displayName: string;
      avatar: string;
    };
  };
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  scheduledTime: string;
  scheduledDate: string;
  scheduledTimeString: string;
  matchDuration: number;
  venue: string;
  description: string;
  result?: {
    team1Score: number;
    team2Score: number;
  };
  isRescheduled?: boolean;
  createdBy?: {
    _id: string;
    username: string;
    profile?: {
      displayName: string;
    };
  };
  lastModifiedBy?: {
    _id: string;
    username: string;
    profile?: {
      displayName: string;
    };
  };
}

interface TournamentScheduleProps {
  tournament: {
    _id: string;
    name: string;
    groups: Array<{
      _id?: string;
      name: string;
      round: number;
      participants: any[];
    }>;
    totalRounds: number;
  };
  isHost: boolean;
  onMatchEdit?: (match: Match) => void;
  onMatchUpdate?: (matchId: string, updates: any) => void;
  onTournamentUpdated?: () => void;
}

const TournamentSchedule: React.FC<TournamentScheduleProps> = ({
  tournament,
  isHost,
  onMatchEdit,
  onMatchUpdate,
  onTournamentUpdated
}) => {
  const [schedule, setSchedule] = useState<Record<string, Match[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRound, setSelectedRound] = useState(1);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [showRoundScheduleModal, setShowRoundScheduleModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [roundHasSchedule, setRoundHasSchedule] = useState(false);

  // Fetch schedule data
  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/tournaments/${tournament._id}/schedule?round=${selectedRound}`);
      const scheduleData = response.data.data.schedule || {};
      setSchedule(scheduleData);
      
      // Check if round has any schedule
      const hasSchedule = Object.keys(scheduleData).length > 0;
      setRoundHasSchedule(hasSchedule);
      
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch schedule');
      setSchedule({});
      setRoundHasSchedule(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [selectedRound, tournament._id]);

  const formatTime = (timeString: string) => {
    if (!timeString) return 'TBD';
    return timeString;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      case 'In Progress': return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'Completed': return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'Cancelled': return 'bg-red-500/20 text-red-300 border border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Scheduled': return <Clock className="h-3 w-3" />;
      case 'In Progress': return <Play className="h-3 w-3" />;
      case 'Completed': return <Calendar className="h-3 w-3" />;
      case 'Cancelled': return <AlertCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };


  const renderGroupMatches = (groupName: string, matches: Match[]) => {
    return (
      <div key={groupName} className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-3">
        {/* Group Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-white flex items-center">
            <Users className="h-4 w-4 mr-2 text-blue-400" />
            {groupName}
          </h3>
          <span className="text-xs text-gray-400">{matches.length} match{matches.length !== 1 ? 'es' : ''}</span>
        </div>

        {/* Matches in Group */}
        <div className="space-y-2">
          {matches.map((match, index) => (
            <div key={match._id} className="bg-gray-700/50 rounded-lg p-3 hover:bg-gray-700/70 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(match.status)}`}>
                    {getStatusIcon(match.status)}
                    <span>{match.status}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium text-sm">Match {index + 1}</span>
                    {match.scheduledTimeString && (
                      <span className="text-gray-400 text-xs">
                        {formatTime(match.scheduledTimeString)}
                      </span>
                    )}
                  </div>
                </div>
                
                {isHost && (
                  <button
                    onClick={() => setEditingMatch(match)}
                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
                  >
                    <Edit className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Get all dates from schedule
  const dates = Object.keys(schedule).sort();

  // Get groups for current round for filter
  const groups = tournament.groups
    .filter(group => group.round === selectedRound)
    .map(group => ({
      value: group._id || group.name,
      label: group.name
    }));

  // Filter matches by group
  const filteredSchedule = selectedGroup === 'all' 
    ? schedule 
    : Object.keys(schedule).reduce((acc, date) => {
        acc[date] = schedule[date].filter(match => 
          match.groupId === selectedGroup || match.groupName === selectedGroup
        );
        return acc;
      }, {} as Record<string, Match[]>);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">
              Tournament Schedule
            </h2>
            <p className="text-gray-400 text-sm">{tournament.name}</p>
          </div>
          
          {isHost && (
            <button
              onClick={() => setShowRoundScheduleModal(true)}
              className={`px-3 py-2 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm font-medium ${
                roundHasSchedule 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <Target className="h-4 w-4" />
              <span>
                {roundHasSchedule 
                  ? `Edit Round ${selectedRound} Schedule` 
                  : `Create Round ${selectedRound} Group Schedule`
                }
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Round Selection and Group Filter */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Round Selection */}
          <div>
            <h3 className="text-base font-semibold text-white mb-2 flex items-center">
              <Target className="h-4 w-4 mr-2 text-green-400" />
              Select Round
            </h3>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: tournament.totalRounds || 4 }, (_, i) => i + 1).map((round) => (
                <button
                  key={round}
                  onClick={() => setSelectedRound(round)}
                  className={`px-3 py-1.5 rounded-lg border transition-colors text-sm font-medium min-w-[70px] ${
                    selectedRound === round
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Round {round}
                </button>
              ))}
            </div>
          </div>

          {/* Group Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Filter by Group
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Groups</option>
              {groups.map(group => (
                <option key={group.value} value={group.value}>
                  {group.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-3 text-sm">Loading schedule...</p>
        </div>
      )}

      {/* Schedule Content */}
      {!loading && dates.length > 0 && (
        <div className="space-y-4">
          {dates.map(date => {
            // Group matches by group name
            const matchesByGroup = filteredSchedule[date]?.reduce((acc, match) => {
              const groupName = match.groupName;
              if (!acc[groupName]) {
                acc[groupName] = [];
              }
              acc[groupName].push(match);
              return acc;
            }, {} as Record<string, Match[]>);

            return (
              <div key={date} className="space-y-3">
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <h3 className="text-base font-semibold text-white flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                    {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {matchesByGroup && Object.entries(matchesByGroup).map(([groupName, matches]) => 
                    renderGroupMatches(groupName, matches)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No dates available */}
      {!loading && dates.length === 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-500" />
          <h3 className="text-base font-semibold text-white mb-2">No Schedule Available for Round {selectedRound}</h3>
          <p className="text-gray-400 mb-4 text-sm">No group matches have been scheduled for this round yet.</p>
          {isHost && (
            <button
              onClick={() => setShowRoundScheduleModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              Create Round {selectedRound} Group Schedule
            </button>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}

      {/* Modals */}
      <RoundScheduleModal
        isOpen={showRoundScheduleModal}
        onClose={() => setShowRoundScheduleModal(false)}
        tournament={tournament}
        round={selectedRound}
        onSave={(scheduleData) => {
          setShowRoundScheduleModal(false);
          fetchSchedule();
        }}
      />

      <MatchScheduleModal
        isOpen={!!editingMatch}
        onClose={() => setEditingMatch(null)}
        tournament={tournament}
        match={editingMatch}
        onSave={(updatedMatch) => {
          if (onMatchUpdate && editingMatch?._id) {
            onMatchUpdate(editingMatch._id, updatedMatch);
          }
          setEditingMatch(null);
          fetchSchedule();
        }}
      />

    </div>
  );
};

export default TournamentSchedule;