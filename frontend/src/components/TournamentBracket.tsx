import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, Clock, ChevronLeft, ChevronRight, Play, CheckCircle, XCircle } from 'lucide-react';

interface Match {
  _id?: string;
  round: number;
  groupId?: string;
  team1: {
    _id: string;
    username: string;
    profile?: {
      displayName?: string;
      avatar?: string;
    };
  } | null;
  team2: {
    _id: string;
    username: string;
    profile?: {
      displayName?: string;
      avatar?: string;
    };
  } | null;
  winner: {
    _id: string;
    username: string;
    profile?: {
      displayName?: string;
      avatar?: string;
    };
  } | null;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  scheduledTime?: Date;
  result?: {
    team1Score: number;
    team2Score: number;
  };
}

interface TournamentBracketProps {
  tournament: {
    _id: string;
    name: string;
    format: string;
    status: string;
    currentRound: number;
    totalRounds: number;
    matches: Match[];
    groups?: Array<{
      name: string;
      participants: any[];
    }>;
  };
  isHost?: boolean;
  onMatchUpdate?: (matchId: string, result: { team1Score: number; team2Score: number }) => void;
  onStartMatch?: (matchId: string) => void;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({
  tournament,
  isHost = false,
  onMatchUpdate,
  onStartMatch
}) => {
  const [currentRound, setCurrentRound] = useState(tournament.currentRound);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  // Group matches by round
  const matchesByRound = tournament.matches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  // Group matches by group (for group stage)
  const matchesByGroup = tournament.matches.reduce((acc, match) => {
    const groupKey = match.groupId || 'all';
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  const getRoundName = (round: number) => {
    const totalRounds = tournament.totalRounds;
    if (tournament.format === 'Solo' || tournament.format === 'Duo') {
      if (round === 1) return 'Round of 16';
      if (round === 2) return 'Quarter Finals';
      if (round === 3) return 'Semi Finals';
      if (round === 4) return 'Finals';
      return `Round ${round}`;
    } else {
      if (round === 1) return 'Group Stage';
      if (round === 2) return 'Quarter Finals';
      if (round === 3) return 'Semi Finals';
      if (round === 4) return 'Finals';
      return `Round ${round}`;
    }
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'In Progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMatch = (match: Match) => {
    const isWinner1 = match.winner && match.team1 && match.winner._id === match.team1._id;
    const isWinner2 = match.winner && match.team2 && match.winner._id === match.team2._id;

    return (
      <div key={match._id || `${match.round}-${match.team1?._id}-${match.team2?._id}`} 
           className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
        {/* Match Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded text-xs ${getMatchStatusColor(match.status)}`}>
              {match.status}
            </span>
            {match.scheduledTime && (
              <span className="text-xs text-gray-400 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(match.scheduledTime)}
              </span>
            )}
          </div>
          {isHost && match.status === 'Scheduled' && (
            <button
              onClick={() => onStartMatch?.(match._id || '')}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
            >
              <Play className="h-3 w-3" />
              <span>Start</span>
            </button>
          )}
        </div>

        {/* Teams */}
        <div className="space-y-2">
          {/* Team 1 */}
          <div className={`flex items-center justify-between p-3 rounded-lg ${
            isWinner1 ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-700/50'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                {match.team1?.profile?.avatar ? (
                  <img 
                    src={match.team1.profile.avatar} 
                    alt={match.team1.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold">
                    {match.team1?.username?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <div className="font-semibold text-white">
                  {match.team1?.profile?.displayName || match.team1?.username}
                </div>
                <div className="text-xs text-gray-400">@{match.team1?.username}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {match.result && (
                <span className="text-lg font-bold text-white">
                  {match.result.team1Score}
                </span>
              )}
              {isWinner1 && <CheckCircle className="h-5 w-5 text-green-400" />}
            </div>
          </div>

          {/* VS */}
          <div className="text-center text-gray-400 text-sm font-bold">VS</div>

          {/* Team 2 */}
          <div className={`flex items-center justify-between p-3 rounded-lg ${
            isWinner2 ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-700/50'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                {match.team2?.profile?.avatar ? (
                  <img 
                    src={match.team2.profile.avatar} 
                    alt={match.team2.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold">
                    {match.team2?.username?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <div className="font-semibold text-white">
                  {match.team2?.profile?.displayName || match.team2?.username}
                </div>
                <div className="text-xs text-gray-400">@{match.team2?.username}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {match.result && (
                <span className="text-lg font-bold text-white">
                  {match.result.team2Score}
                </span>
              )}
              {isWinner2 && <CheckCircle className="h-5 w-5 text-green-400" />}
            </div>
          </div>
        </div>

        {/* Match Actions for Host */}
        {isHost && match.status === 'In Progress' && (
          <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
            <div className="text-sm text-gray-300 mb-2">Update Score:</div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">
                  {match.team1?.username}:
                </span>
                <input
                  type="number"
                  min="0"
                  className="w-16 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-center"
                  placeholder="0"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">
                  {match.team2?.username}:
                </span>
                <input
                  type="number"
                  min="0"
                  className="w-16 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-center"
                  placeholder="0"
                />
              </div>
              <button
                onClick={() => {
                  // This would be handled by parent component
                  console.log('Update match result');
                }}
                className="px-4 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGroupStage = () => {
    if (!tournament.groups || tournament.groups.length === 0) {
      return (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Groups Assigned</h3>
          <p className="text-gray-400">Groups will appear here once participants are assigned</p>
        </div>
      );
    }

    return (
      <div>
        {/* Group Selector */}
        <div className="mb-6">
          <div className="flex space-x-2 overflow-x-auto">
            <button
              onClick={() => setSelectedGroup('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                selectedGroup === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All Groups
            </button>
            {tournament.groups.map((group, index) => (
              <button
                key={index}
                onClick={() => setSelectedGroup(group.name)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedGroup === group.name
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {group.name}
              </button>
            ))}
          </div>
        </div>

        {/* Group Matches */}
        <div className="space-y-6">
          {selectedGroup === 'all' ? (
            tournament.groups.map((group, index) => (
              <div key={index}>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-400" />
                  {group.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchesByGroup[group.name]?.map(renderMatch) || (
                    <div className="text-center py-4 text-gray-400">
                      No matches scheduled for this group
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-400" />
                {selectedGroup}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchesByGroup[selectedGroup]?.map(renderMatch) || (
                  <div className="text-center py-4 text-gray-400">
                    No matches scheduled for this group
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEliminationBracket = () => {
    return (
      <div>
        {/* Round Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentRound(Math.max(1, currentRound - 1))}
            disabled={currentRound <= 1}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">{getRoundName(currentRound)}</h2>
            <p className="text-sm text-gray-400">Round {currentRound} of {tournament.totalRounds}</p>
          </div>
          
          <button
            onClick={() => setCurrentRound(Math.min(tournament.totalRounds, currentRound + 1))}
            disabled={currentRound >= tournament.totalRounds}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Round Matches */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matchesByRound[currentRound]?.map(renderMatch) || (
            <div className="col-span-full text-center py-8">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Matches</h3>
              <p className="text-gray-400">No matches scheduled for this round</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Trophy className="h-6 w-6 mr-3 text-yellow-400" />
            Tournament Bracket
          </h2>
          <p className="text-gray-400 mt-1">{tournament.name}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Status</div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            tournament.status === 'Ongoing' ? 'bg-green-500/20 text-green-400' :
            tournament.status === 'Upcoming' ? 'bg-blue-500/20 text-blue-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {tournament.status}
          </div>
        </div>
      </div>

      {/* Bracket Content */}
      {tournament.format === 'Solo' || tournament.format === 'Duo' ? 
        renderEliminationBracket() : 
        renderGroupStage()
      }
    </div>
  );
};

export default TournamentBracket;
