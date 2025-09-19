import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Clock, 
  Target, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Play, 
  AlertCircle,
  Crown,
  BarChart3,
  Gamepad2,
  Eye,
  Tv,
  Award,
  TrendingUp,
  MapPin,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';

interface Match {
  _id?: string;
  round: number;
  groupId?: string;
  groupName?: string;
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
  scheduledTimeString?: string;
  venue?: string;
  description?: string;
  result?: {
    team1Score: number;
    team2Score: number;
  };
}

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
  currentRound: number;
  totalRounds: number;
  prizePool: number;
  prizePoolType: string;
  participants: any[];
  teams: any[];
  groups: Array<{
    name: string;
    participants: any[];
    round: number;
    groupLetter?: string;
    _id?: string;
  }>;
  matches: Match[];
  host: {
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
  groupResults?: Array<{
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
  roundSettings?: Array<{
    round: number;
    teamsPerGroup: number;
    qualificationCriteria: number;
    totalGroups: number;
    totalTeams: number;
  }>;
  schedule?: Array<{
    round: number;
    startTime: string;
    endTime: string;
    description: string;
    status: 'upcoming' | 'ongoing' | 'completed';
  }>;
}

interface TournamentParticipantViewProps {
  tournament: Tournament;
  userId: string;
}

const TournamentParticipantView: React.FC<TournamentParticipantViewProps> = ({
  tournament,
  userId
}) => {
  const [activeTab, setActiveTab] = useState('tournament-info');
  const navigate = useNavigate();

  // Find user's group - for duo tournaments, check if user's team is in the group
  // For solo tournaments, check if user is directly in the group
  const userGroup = tournament.groups.find(group => {
    if (tournament.format === 'Duo') {
      // For duo tournaments, check if user's team is in the group
      return group.participants.some(p => {
        // Check if this participant is a team that the user belongs to
        return tournament.teams.some(team => 
          team._id === p._id && 
          team.teamInfo?.members?.some(member => 
            (typeof member.user === 'string' ? member.user : member.user?._id) === userId
          )
        );
      });
    } else {
      // For solo tournaments, check if user is directly in the group
      return group.participants.some(p => p._id === userId);
    }
  });

  // Find user's matches
  const userMatches = tournament.matches.filter(match => 
    (match.team1 && match.team1._id === userId) || 
    (match.team2 && match.team2._id === userId)
  );

  // Find upcoming matches
  const upcomingMatches = userMatches.filter(match => 
    match.status === 'Scheduled' || match.status === 'In Progress'
  );

  // Find completed matches
  const completedMatches = userMatches.filter(match => 
    match.status === 'Completed'
  );

  // Check if user is in a team
  const isTeam = tournament.teams.some(team => team._id === userId);
  // Check if user is a participant (either individual, team, or part of a team)
  const isParticipant = tournament.participants.some(p => p._id === userId) || 
    tournament.teams.some(team => team._id === userId) ||
    tournament.teams.some(team => 
      team.teamInfo?.members?.some(member => 
        (typeof member.user === 'string' ? member.user : member.user._id) === userId
      )
    );

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'In Progress': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
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

  const getOpponent = (match: Match) => {
    if (match.team1 && match.team1._id === userId) {
      return match.team2;
    }
    return match.team1;
  };

  const isWinner = (match: Match) => {
    return match.winner && match.winner._id === userId;
  };

  const renderMyMatches = () => (
    <div className="space-y-6">
      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-yellow-400" />
            Upcoming Matches ({upcomingMatches.length})
          </h3>
          
          <div className="space-y-4">
            {upcomingMatches.map((match, index) => {
              if (!match) {
                return null;
              }
              
              const opponent = getOpponent(match);
              return (
                <div key={match._id || index} className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
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
                    <span className="text-sm text-gray-400">
                      Round {match.round}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-400">You</span>
                      </div>
                      <div>
                        <div className="font-semibold text-white">You</div>
                        <div className="text-sm text-gray-400">
                          {isTeam ? 'Team' : 'Player'}
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">VS</div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="font-semibold text-white">
                          {opponent?.profile?.displayName || opponent?.username || 'TBD'}
                        </div>
                        <div className="text-sm text-gray-400">
                          {opponent ? (isTeam ? 'Team' : 'Player') : 'Waiting for opponent'}
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                        {opponent?.profile?.avatar ? (
                          <img 
                            src={opponent.profile.avatar} 
                            alt={opponent.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold">
                            {opponent?.username?.charAt(0).toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Matches */}
      {completedMatches.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
            Completed Matches ({completedMatches.length})
          </h3>
          
          <div className="space-y-4">
            {completedMatches.map((match, index) => {
              if (!match) {
                return null;
              }
              
              const opponent = getOpponent(match);
              const won = isWinner(match);
              
              return (
                <div key={match._id || index} className={`border rounded-lg p-4 ${
                  won ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-700/50 border-gray-600'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${getMatchStatusColor(match.status)}`}>
                        {match.status}
                      </span>
                      {won && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                          Won
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-400">
                      Round {match.round}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        won ? 'bg-green-500/20' : 'bg-gray-600'
                      }`}>
                        <span className="text-sm font-bold text-white">You</span>
                      </div>
                      <div>
                        <div className="font-semibold text-white">You</div>
                        <div className="text-sm text-gray-400">
                          {match.result ? match.result.team1Score : '0'}
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">VS</div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="font-semibold text-white">
                          {opponent?.profile?.displayName || opponent?.username}
                        </div>
                        <div className="text-sm text-gray-400">
                          {match.result ? match.result.team2Score : '0'}
                        </div>
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        !won ? 'bg-green-500/20' : 'bg-gray-600'
                      }`}>
                        {opponent?.profile?.avatar ? (
                          <img 
                            src={opponent.profile.avatar} 
                            alt={opponent.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold">
                            {opponent?.username?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {userMatches.length === 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 lg:p-8 text-center">
          <Gamepad2 className="h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base lg:text-lg font-semibold text-white mb-2">No Matches Yet</h3>
          <p className="text-gray-400 text-sm lg:text-base">Your matches will appear here once the tournament starts</p>
        </div>
      )}
    </div>
  );

  const renderAllGroups = () => (
    <div className="space-y-6">
      {/* Round-wise Groups */}
      {Array.from({ length: tournament.totalRounds }, (_, roundIndex) => {
        const roundNumber = roundIndex + 1;
        const roundGroups = tournament.groups.filter(group => group.round === roundNumber);
        
        return (
          <div key={roundNumber} className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
            <h3 className="text-base lg:text-lg font-semibold text-white mb-4 flex items-center">
              <Target className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-blue-400" />
              Round {roundNumber} Groups
              {roundNumber === tournament.currentRound && 
               !tournament.groupResults?.some(result => result.round === roundNumber) && (
                <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                  Current Round
                </span>
              )}
            </h3>
            
            {roundGroups.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                {roundGroups.map((group, groupIndex) => (
                  <div key={group._id || groupIndex} className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 lg:p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white text-sm lg:text-base">{group.name}</h4>
                      <span className="text-xs lg:text-sm text-gray-400">
                        {group.participants.length} participants
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {group.participants.slice(0, 3).map((participant, pIndex) => (
                        <div key={participant._id || pIndex} className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                            {participant.profile?.avatar ? (
                              <img 
                                src={participant.profile.avatar} 
                                alt={participant.username || 'User'}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-bold">
                                {(participant.username || 'U').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-300 truncate">
                            {participant.profile?.displayName || participant.username || 'Unknown User'}
                          </span>
                        </div>
                      ))}
                      {group.participants.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{group.participants.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 lg:py-8 text-gray-400">
                <Users className="h-10 w-10 lg:h-12 lg:w-12 mx-auto mb-4" />
                <p className="text-sm lg:text-base">Groups will be created when Round {roundNumber} starts</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderSchedule = () => {
    // Find user's group
    const userGroup = tournament.groups.find(group => 
      group.participants.some(p => p._id === userId)
    );

    // Filter matches for user's group only - more comprehensive filtering
    const userGroupMatches = tournament.matches.filter(match => {
      // Check if match belongs to user's group
      const isUserGroupMatch = match.groupName === userGroup?.name || 
                              match.groupId === userGroup?._id ||
                              match.groupId === userGroup?.name;
      
      // Also include matches where user is directly involved (team1 or team2)
      const isUserDirectMatch = (match.team1 && match.team1._id === userId) || 
                               (match.team2 && match.team2._id === userId);
      
      // Include all matches for the user's group regardless of round
      const isGroupMatch = userGroup && (
        match.groupName === userGroup.name ||
        match.groupId === userGroup._id ||
        match.groupId === userGroup.name
      );
      
      return isUserGroupMatch || isUserDirectMatch || isGroupMatch;
    });

    // If no group matches found, show all matches for debugging
    const finalMatches = userGroupMatches.length > 0 ? userGroupMatches : tournament.matches;

    // Group matches by round first, then by date
    const matchesByRound = finalMatches.reduce((acc, match) => {
      const round = match.round;
      if (!acc[round]) {
        acc[round] = {};
      }
      
      if (match.scheduledTime) {
        const date = new Date(match.scheduledTime).toDateString();
        if (!acc[round][date]) {
          acc[round][date] = [];
        }
        acc[round][date].push(match);
      }
      return acc;
    }, {} as { [key: number]: { [key: string]: Match[] } });

    // Sort matches within each date by time
    Object.keys(matchesByRound).forEach(round => {
      const roundNum = parseInt(round);
      Object.keys(matchesByRound[roundNum]).forEach(date => {
        matchesByRound[roundNum][date].sort((a: Match, b: Match) => 
          new Date(a.scheduledTime!).getTime() - new Date(b.scheduledTime!).getTime()
        );
      });
    });

    return (
      <div className="space-y-6">
        {/* Your Group Schedule */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <h3 className="text-base lg:text-lg font-semibold text-white mb-4 flex items-center">
            <Calendar className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-blue-400" />
            Your Group Schedule - {userGroup?.name || 'Group A'}
          </h3>
          
          {Object.keys(matchesByRound).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(matchesByRound).map(([round, matchesByDate]) => {
                const roundNum = parseInt(round);
                return (
                  <div key={round} className="space-y-4">
                    <h4 className="text-md font-semibold text-white flex items-center">
                      <Target className="h-4 w-4 mr-2 text-purple-400" />
                      Round {round}
                      {roundNum === tournament.currentRound && (
                        <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                          Current Round
                        </span>
                      )}
                    </h4>
                    
                    {Object.entries(matchesByDate).map(([date, matches]) => (
                      <div key={date} className="space-y-3">
                        <h5 className="text-sm font-medium text-gray-300 flex items-center">
                          <Calendar className="h-3 w-3 mr-2 text-gray-400" />
                          {new Date(date).toLocaleDateString('en-GB', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </h5>
                        
                        <div className="space-y-2">
                          {matches.map((match, index) => (
                            <div key={match._id || index} className={`border rounded-lg p-3 ${
                              match.status === 'In Progress' ? 'bg-green-500/10 border-green-500/30' :
                              match.status === 'Completed' ? 'bg-gray-700/50 border-gray-600' :
                              'bg-blue-500/10 border-blue-500/30'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center">
                                    <Users className="h-3 w-3 text-purple-400" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-white text-sm">
                                      {match.groupName || 'Group Match'}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      {match.venue || 'Online'}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    match.status === 'In Progress' ? 'bg-green-500/20 text-green-400' :
                                    match.status === 'Completed' ? 'bg-gray-500/20 text-gray-400' :
                                    'bg-blue-500/20 text-blue-400'
                                  }`}>
                                    {match.status}
                                  </span>
                                  <div className="flex items-center text-sm text-gray-400">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {match.scheduledTimeString || new Date(match.scheduledTime!).toLocaleTimeString('en-GB', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 lg:py-8 text-gray-400">
              <Calendar className="h-10 w-10 lg:h-12 lg:w-12 mx-auto mb-4" />
              <p className="text-sm lg:text-base">No matches scheduled for your group yet</p>
              <p className="text-xs lg:text-sm mt-2">Schedule will be announced soon</p>
            </div>
          )}
        </div>

        {/* Round 2 Schedule - Separate Container */}
        {(matchesByRound[2] && Object.keys(matchesByRound[2]).length > 0) || (
          // Show all Round 2 matches if no group-specific matches found
          tournament.matches.filter(match => match.round === 2).length > 0
        ) && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2 text-green-400" />
              Round 2 Schedule
            </h3>
            
            <div className="space-y-4">
              {(() => {
                // Use group-specific matches if available, otherwise show all Round 2 matches
                const round2Matches = matchesByRound[2] || {};
                const hasGroupMatches = Object.keys(round2Matches).length > 0;
                
                if (!hasGroupMatches) {
                  // Show all Round 2 matches grouped by date
                  const allRound2Matches = tournament.matches.filter(match => match.round === 2);
                  const groupedByDate = allRound2Matches.reduce((acc, match) => {
                    if (match.scheduledTime) {
                      const date = new Date(match.scheduledTime).toDateString();
                      if (!acc[date]) acc[date] = [];
                      acc[date].push(match);
                    }
                    return acc;
                  }, {} as { [key: string]: Match[] });
                  
                  return Object.entries(groupedByDate).map(([date, matches]) => (
                    <div key={date} className="space-y-3">
                      <h5 className="text-sm font-medium text-gray-300 flex items-center">
                        <Calendar className="h-3 w-3 mr-2 text-gray-400" />
                        {new Date(date).toLocaleDateString('en-GB', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h5>
                      
                      <div className="space-y-2">
                        {matches.map((match, index) => (
                          <div key={match._id || index} className={`border rounded-lg p-3 ${
                            match.status === 'In Progress' ? 'bg-green-500/10 border-green-500/30' :
                            match.status === 'Completed' ? 'bg-gray-700/50 border-gray-600' :
                            'bg-blue-500/10 border-blue-500/30'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                                  <Users className="h-3 w-3 text-green-400" />
                                </div>
                                <div>
                                  <div className="font-semibold text-white text-sm">
                                    {match.groupName || 'Group Match'}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {match.venue || 'Online'}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-3">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  match.status === 'In Progress' ? 'bg-green-500/20 text-green-400' :
                                  match.status === 'Completed' ? 'bg-gray-500/20 text-gray-400' :
                                  'bg-blue-500/20 text-blue-400'
                                }`}>
                                  {match.status}
                                </span>
                                <div className="flex items-center text-sm text-gray-400">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {match.scheduledTimeString || new Date(match.scheduledTime!).toLocaleTimeString('en-GB', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                }
                
                // Show group-specific matches
                return Object.entries(round2Matches).map(([date, matches]) => (
                  <div key={date} className="space-y-3">
                    <h5 className="text-sm font-medium text-gray-300 flex items-center">
                      <Calendar className="h-3 w-3 mr-2 text-gray-400" />
                      {new Date(date).toLocaleDateString('en-GB', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h5>
                    
                    <div className="space-y-2">
                      {matches.map((match, index) => (
                        <div key={match._id || index} className={`border rounded-lg p-3 ${
                          match.status === 'In Progress' ? 'bg-green-500/10 border-green-500/30' :
                          match.status === 'Completed' ? 'bg-gray-700/50 border-gray-600' :
                          'bg-blue-500/10 border-blue-500/30'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                                <Users className="h-3 w-3 text-green-400" />
                              </div>
                              <div>
                                <div className="font-semibold text-white text-sm">
                                  {match.groupName || 'Group Match'}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {match.venue || 'Online'}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <span className={`px-2 py-1 rounded text-xs ${
                                match.status === 'In Progress' ? 'bg-green-500/20 text-green-400' :
                                match.status === 'Completed' ? 'bg-gray-500/20 text-gray-400' :
                                'bg-blue-500/20 text-blue-400'
                              }`}>
                                {match.status}
                              </span>
                              <div className="flex items-center text-sm text-gray-400">
                                <Clock className="h-3 w-3 mr-1" />
                                {match.scheduledTimeString || new Date(match.scheduledTime!).toLocaleTimeString('en-GB', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

      </div>
    );
  };

  const renderBroadcast = () => {
    // Find user's group - for duo tournaments, check if user's team is in the group
    // For solo tournaments, check if user is directly in the group
    const userGroup = tournament.groups.find(group => {
      if (tournament.format === 'Duo') {
        // For duo tournaments, check if user's team is in the group
        return group.participants.some(p => {
          // Check if this participant is a team that the user belongs to
          return tournament.teams.some(team => 
            team._id === p._id && 
            team.teamInfo?.members?.some(member => 
              (typeof member.user === 'string' ? member.user : member.user?._id) === userId
            )
          );
        });
      } else {
        // For solo tournaments, check if user is directly in the group
        return group.participants.some(p => p._id === userId);
      }
    });

    // Get round-wise broadcast channels and messages
    const getRoundWiseData = () => {
      const rounds = new Set<number>();
      
      console.log('=== Broadcast Debug ===');
      console.log('User Group:', userGroup);
      console.log('Tournament Groups:', tournament.groups);
      console.log('Broadcast Channels:', tournament.broadcastChannels);
      
      // Collect all rounds from groups, channels, and messages
      tournament.groups.forEach(group => rounds.add(group.round || 1));
      if (tournament.broadcastChannels) {
        tournament.broadcastChannels.forEach(channel => {
          if (channel.round) rounds.add(channel.round);
        });
      }
      if (tournament.groupMessages) {
        tournament.groupMessages.forEach(msg => rounds.add(msg.round));
      }

      return Array.from(rounds).sort((a, b) => a - b);
    };

    const rounds = getRoundWiseData();

    return (
      <div className="space-y-4">
        {rounds.map(round => {
          // Get channels for this round
          const roundChannels = tournament.broadcastChannels?.filter(channel => {
            const matchesRound = channel.round === round || !channel.round;
            const matchesGroup = !channel.groupId || channel.groupId === userGroup?._id || channel.groupId === userGroup?.name;
            
            console.log(`Channel ${channel.name}:`, {
              channelRound: channel.round,
              targetRound: round,
              matchesRound,
              channelGroupId: channel.groupId,
              userGroupId: userGroup?._id,
              userGroupName: userGroup?.name,
              matchesGroup,
              finalMatch: matchesRound && matchesGroup
            });
            
            return matchesRound && matchesGroup;
          }) || [];

          // Get messages for this round and user's group
          const roundMessages = tournament.groupMessages?.find(gm => 
            gm.groupId === (userGroup?._id || userGroup?.name) && gm.round === round
          )?.messages || [];

          return (
            <div key={round} className="bg-gray-800 border border-gray-700 rounded-lg">
              {/* Collapsible Header */}
              <button
                className="w-full p-3 lg:p-4 text-left flex items-center justify-between hover:bg-gray-700/50 transition-colors mobile-touch-target"
                onClick={() => {
                  const content = document.getElementById(`round-${round}-content`);
                  const icon = document.getElementById(`round-${round}-icon`);
                  if (content && icon) {
                    content.classList.toggle('hidden');
                    icon.classList.toggle('rotate-180');
                  }
                }}
              >
                <div className="flex items-center">
                  <Tv className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-red-400" />
                  <h3 className="text-base lg:text-lg font-semibold text-white">
                    Round {round} - Broadcast & Messages
                  </h3>
                  {round === tournament.currentRound && 
                   !tournament.groupResults?.some(result => result.round === round) && (
                    <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                      Current Round
                    </span>
                  )}
                </div>
                <div className="text-gray-400">
                  <svg 
                    id={`round-${round}-icon`}
                    className="w-4 h-4 lg:w-5 lg:h-5 transform transition-transform duration-200" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Collapsible Content */}
              <div id={`round-${round}-content`} className="px-4 pb-4">
                {/* Broadcast Channels */}
                {roundChannels.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-md font-semibold text-white mb-3 flex items-center">
                      <Tv className="h-4 w-4 mr-2 text-red-400" />
                      Broadcast Channels ({roundChannels.length})
                    </h4>
                    <div className="space-y-3">
                      {roundChannels.map((channel: any, index: number) => (
                        <div key={index} className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                                <Tv className="h-4 w-4 text-red-400" />
                              </div>
                              <div>
                                <h5 className="font-semibold text-white text-sm">{channel.name}</h5>
                                <p className="text-xs text-gray-400">{channel.platform}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {channel.isLive && (
                                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded flex items-center">
                                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full mr-1 animate-pulse"></div>
                                  LIVE
                                </span>
                              )}
                              <a
                                href={channel.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Watch
                              </a>
                            </div>
                          </div>
                          
                          {channel.description && (
                            <p className="text-xs text-gray-300">{channel.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Group Messages with Scrolling */}
                {roundMessages.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold text-white mb-3 flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2 text-blue-400" />
                      Group Messages ({roundMessages.length})
                    </h4>
                    <div className="max-h-80 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                      {roundMessages
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((message: any, index: number) => (
                        <div key={index} className="bg-gray-700/30 border border-gray-600 rounded-lg p-3">
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                              {message.sender.profile?.avatar ? (
                                <img 
                                  src={message.sender.profile.avatar} 
                                  alt={message.sender.username}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-bold text-blue-400">
                                  {message.sender.username?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-semibold text-white">
                                  {message.sender.profile?.displayName || message.sender.username}
                                </span>
                                {message.type === 'announcement' && (
                                  <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                                    Announcement
                                  </span>
                                )}
                                <span className="text-xs text-gray-400">
                                  {new Date(message.timestamp).toLocaleString('en-GB')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-300 break-words">{message.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No content message */}
                {roundChannels.length === 0 && roundMessages.length === 0 && (
                  <div className="text-center py-4 lg:py-6 text-gray-400">
                    <Tv className="h-6 w-6 lg:h-8 lg:w-8 mx-auto mb-2" />
                    <p className="text-xs lg:text-sm">No broadcast channels or messages for Round {round}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* No rounds message */}
        {rounds.length === 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 lg:p-8 text-center">
            <Tv className="h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base lg:text-lg font-semibold text-white mb-2">No Broadcast Information</h3>
            <p className="text-gray-400 text-sm lg:text-base">Broadcast channels and messages will be available when the tournament starts</p>
          </div>
        )}
      </div>
    );
  };

  const renderResults = () => (
    <div className="space-y-6">
      {/* All Group Results */}
      {tournament.groupResults && tournament.groupResults.length > 0 ? (
        tournament.groupResults.map((groupResult, index) => (
          <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base lg:text-lg font-semibold text-white flex items-center">
                <Award className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-yellow-400" />
                Round {groupResult.round} - {groupResult.groupName}
              </h3>
              {groupResult.submittedAt && (
                <span className="text-xs lg:text-sm text-gray-400">
                  Results submitted: {new Date(groupResult.submittedAt).toLocaleString('en-GB')}
                </span>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-2 text-xs lg:text-sm font-medium text-gray-400">Rank</th>
                    <th className="text-left py-2 text-xs lg:text-sm font-medium text-gray-400">Team</th>
                    <th className="text-center py-2 text-xs lg:text-sm font-medium text-gray-400">Wins</th>
                    <th className="text-center py-2 text-xs lg:text-sm font-medium text-gray-400">Finish Points</th>
                    <th className="text-center py-2 text-xs lg:text-sm font-medium text-gray-400">Position Points</th>
                    <th className="text-center py-2 text-xs lg:text-sm font-medium text-gray-400">Total Points</th>
                    <th className="text-center py-2 text-xs lg:text-sm font-medium text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {groupResult.teams.map((team, teamIndex) => (
                    <tr key={teamIndex} className="border-b border-gray-700/50">
                      <td className="py-2 lg:py-3 text-xs lg:text-sm font-semibold text-white">
                        #{team.rank}
                      </td>
                      <td className="py-2 lg:py-3">
                        <div className="flex items-center space-x-2 lg:space-x-3">
                          {team.teamLogo && (
                            <img 
                              src={team.teamLogo} 
                              alt={team.teamName}
                              className="w-6 h-6 lg:w-8 lg:h-8 rounded-full object-cover"
                            />
                          )}
                          <span className="text-xs lg:text-sm text-white truncate">{team.teamName}</span>
                        </div>
                      </td>
                      <td className="py-2 lg:py-3 text-center text-xs lg:text-sm text-gray-300">{team.wins}</td>
                      <td className="py-2 lg:py-3 text-center text-xs lg:text-sm text-gray-300">{team.finishPoints}</td>
                      <td className="py-2 lg:py-3 text-center text-xs lg:text-sm text-gray-300">{team.positionPoints}</td>
                      <td className="py-2 lg:py-3 text-center text-xs lg:text-sm font-semibold text-white">{team.totalPoints}</td>
                       <td className="py-2 lg:py-3 text-center">
                         {(() => {
                           // For final round, show winner/runner-up status
                           if (groupResult.round === tournament.totalRounds) {
                             if (team.rank === 1) {
                               return (
                                 <span className="px-1 lg:px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                                   WINNER
                                 </span>
                               );
                             } else if (team.rank === 2) {
                               return (
                                 <span className="px-1 lg:px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">
                                   RUNNER-UP
                                 </span>
                               );
                             } else if (team.rank === 3) {
                               return (
                                 <span className="px-1 lg:px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded">
                                   2ND RUNNER-UP
                                 </span>
                               );
                             } else {
                               return (
                                 <span className="px-1 lg:px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">
                                   -
                                 </span>
                               );
                             }
                           }
                           // For intermediate rounds, show qualified/eliminated
                           return team.qualified ? (
                             <span className="px-1 lg:px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                               Qualified
                             </span>
                           ) : (
                             <span className="px-1 lg:px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">
                               Eliminated
                             </span>
                           );
                         })()}
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 lg:p-8 text-center">
          <Award className="h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base lg:text-lg font-semibold text-white mb-2">No Results Yet</h3>
          <p className="text-gray-400 text-sm lg:text-base">Results will be displayed here as rounds complete</p>
        </div>
      )}
    </div>
  );

  const renderMyGroup = () => {
    // Find all groups where user is a participant, organized by round
    const userGroupsByRound = tournament.groups.reduce((acc, group) => {
      let isUserInGroup = false;
      
      if (tournament.format === 'Duo') {
        // For duo tournaments, check if user's team is in the group
        isUserInGroup = group.participants.some(p => {
          return tournament.teams.some(team => 
            team._id === p._id && 
            team.teamInfo?.members?.some(member => 
              (typeof member.user === 'string' ? member.user : member.user?._id) === userId
            )
          );
        });
      } else {
        // For solo tournaments, check if user is directly in the group
        isUserInGroup = group.participants.some(p => p._id === userId);
      }
      
      if (isUserInGroup) {
        const round = group.round || 1;
        if (!acc[round]) {
          acc[round] = [];
        }
        acc[round].push(group);
      }
      return acc;
    }, {} as { [key: number]: any[] });

    return (
      <div className="space-y-6">
        {Object.keys(userGroupsByRound).length > 0 ? (
          Object.entries(userGroupsByRound).map(([round, groups]) => (
            <div key={round} className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
              <h3 className="text-base lg:text-lg font-semibold text-white mb-4 flex items-center">
                <Users className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-blue-400" />
                Round {round} - Your Group{groups.length > 1 ? 's' : ''}
                {parseInt(round) === tournament.currentRound && 
                 !tournament.groupResults?.some(result => result.round === parseInt(round)) && (
                  <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                    Current Round
                  </span>
                )}
              </h3>
              
              <div className="space-y-4">
                {groups.map((group, groupIndex) => (
                  <div key={group._id || groupIndex} className="space-y-3">
                    <h4 className="text-md font-medium text-gray-300 flex items-center">
                      <Target className="h-4 w-4 mr-2 text-purple-400" />
                      {group.name}
                    </h4>
                    
                    <div className="space-y-2">
                      {group.participants.map((participant: any, index: number) => {
                        if (!participant) {
                          return null;
                        }
                        
                        return (
                          <div key={participant._id || index} className={`flex items-center justify-between p-3 rounded-lg ${
                            participant._id === userId 
                              ? 'bg-blue-500/10 border border-blue-500/30' 
                              : 'bg-gray-700/50'
                          }`}>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                {participant.profile?.avatar ? (
                                  <img 
                                    src={participant.profile.avatar} 
                                    alt={participant.username || 'User'}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-bold">
                                    {(participant.username || 'U').charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-white">
                                  {participant.profile?.displayName || participant.username || 'Unknown User'}
                                  {participant._id === userId && (
                                    <span className="ml-2 text-xs text-blue-400">(You)</span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-400">@{participant.username || 'unknown'}</div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-400">
                              {participant._id === userId ? 'You' : 'Opponent'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 lg:p-8 text-center">
            <Users className="h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base lg:text-lg font-semibold text-white mb-2">No Group Assigned</h3>
            <p className="text-gray-400 text-sm lg:text-base">You will be assigned to a group once the tournament starts</p>
          </div>
        )}
      </div>
    );
  };

  const renderTournamentInfo = () => {
    // Find user's results from all rounds
    const getUserResults = () => {
      if (tournament.groupResults && tournament.groupResults.length > 0) {
        const userResults = [];
        for (const groupResult of tournament.groupResults) {
          const userTeam = groupResult.teams.find(team => team.teamId === userId);
          if (userTeam) {
            userResults.push({
              round: groupResult.round,
              groupName: groupResult.groupName,
              rank: userTeam.rank,
              qualified: userTeam.qualified,
              isFinalRound: groupResult.round === tournament.totalRounds,
              totalPoints: userTeam.totalPoints,
              wins: userTeam.wins
            });
          }
        }
        return userResults.sort((a, b) => a.round - b.round); // Sort by round
      }
      return [];
    };

    const userResults = getUserResults();
    // Sort results to show latest round first
    const sortedResults = userResults.sort((a, b) => b.round - a.round);

    return (
      <div className="space-y-6">
        {/* User's Tournament Results - All Rounds */}
        {sortedResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Crown className="h-5 w-5 mr-2 text-yellow-400" />
              Your Tournament Results
            </h3>
            
            {sortedResults.map((result, index) => (
              <div key={index} className={`border rounded-lg p-4 ${
                result.isFinalRound 
                  ? 'bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-500/30'
                  : result.qualified
                    ? 'bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500/30'
                    : 'bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-white mb-1">
                      {result.isFinalRound ? (
                        result.rank === 1 ? '🏆 WINNER' : 
                        result.rank === 2 ? '🥈 RUNNER-UP' :
                        result.rank === 3 ? '🥉 2ND RUNNER-UP' :
                        `#${result.rank}`
                      ) : (
                        result.qualified ? '✅ QUALIFIED' : '❌ ELIMINATED'
                      )}
                    </div>
                    <div className="text-base font-medium text-gray-300">
                      {result.isFinalRound ? 'Final' : `Round ${result.round} - ${result.groupName}`}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white mb-1">
                      #{result.rank}
                    </div>
                    <div className="text-xl font-bold text-white">
                      {result.totalPoints} pts
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tournament Overview */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <h3 className="text-base lg:text-lg font-semibold text-white mb-4 flex items-center">
            <Trophy className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-yellow-400" />
            Tournament Information
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm lg:text-base">Basic Info</h4>
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
                  <span className="text-gray-400">Mode:</span>
                  <span className="text-white">{tournament.mode || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    tournament.status === 'Ongoing' ? 'bg-green-500/20 text-green-400' :
                    tournament.status === 'Upcoming' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {tournament.status}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3 text-sm lg:text-base">Schedule</h4>
              <div className="space-y-2 text-xs lg:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Start Date:</span>
                  <span className="text-white">
                    {new Date(tournament.startDate).toLocaleDateString('en-GB')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">End Date:</span>
                  <span className="text-white">
                    {new Date(tournament.endDate).toLocaleDateString('en-GB')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Round:</span>
                  <span className="text-white">{tournament.currentRound}/{tournament.totalRounds}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prize Pool */}
        {tournament.prizePoolType === 'with_prize' && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
            <h3 className="text-base lg:text-lg font-semibold text-white mb-4 flex items-center">
              <Crown className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-yellow-400" />
              Prize Pool
            </h3>
            <div className="text-center">
              <div className="text-2xl lg:text-4xl font-bold text-yellow-400 mb-2">
                ₹{tournament.prizePool.toLocaleString()}
              </div>
              <p className="text-gray-400 text-sm lg:text-base">Total Prize Pool</p>
            </div>
          </div>
        )}

      </div>
    );
  };


  const tabs = [
    { id: 'tournament-info', label: 'Tournament Info', icon: Trophy },
    { id: 'my-group', label: 'My Group', icon: Users },
    { id: 'all-groups', label: 'All Groups', icon: Eye },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'broadcast', label: 'Broadcast', icon: Tv },
    { id: 'results', label: 'Results', icon: Award }
  ];

  return (
    <div className="min-h-screen bg-black pt-4 md:pt-24">
      {/* Mobile Header with Back Arrow - Hidden on desktop */}
      <div className="flex items-center px-4 py-4 border-b border-gray-800 lg:hidden">
        <button 
          onClick={() => navigate('/tournaments')}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors mr-3"
        >
          <ArrowLeft className="h-6 w-6 text-gray-300" />
        </button>
        <h1 className="text-xl font-bold text-white truncate">{tournament.name}</h1>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 lg:py-8">
        {/* Desktop Header - Hidden on mobile */}
        <div className="mb-6 lg:mb-8 hidden lg:block">
          {/* Back to Tournaments Button */}
          <div className="mb-4">
            <button 
              onClick={() => navigate('/tournaments')}
              className="flex items-center text-gray-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Tournaments</span>
            </button>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Trophy className="h-8 w-8 mr-3 text-yellow-400" />
                {tournament.name}
              </h1>
              <p className="text-gray-400 mt-2">Participant View</p>
            </div>
            <div className="text-right">
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                tournament.status === 'Ongoing' ? 'bg-green-500/20 text-green-400' :
                tournament.status === 'Upcoming' ? 'bg-blue-500/20 text-blue-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {tournament.status}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {isTeam ? 'Team' : 'Player'} • {tournament.game}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700 mb-4 lg:mb-6">
          <nav className="flex overflow-x-auto space-x-1 lg:space-x-8 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1 lg:space-x-2 py-3 lg:py-4 px-2 lg:px-1 border-b-2 font-medium text-xs lg:text-sm transition-colors whitespace-nowrap mobile-touch-target ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 lg:h-4 lg:w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px] lg:min-h-[600px]">
          {activeTab === 'tournament-info' && renderTournamentInfo()}
          {activeTab === 'my-group' && renderMyGroup()}
          {activeTab === 'all-groups' && renderAllGroups()}
          {activeTab === 'schedule' && renderSchedule()}
          {activeTab === 'broadcast' && renderBroadcast()}
          {activeTab === 'results' && renderResults()}
        </div>
      </div>
    </div>
  );
};

export default TournamentParticipantView;

