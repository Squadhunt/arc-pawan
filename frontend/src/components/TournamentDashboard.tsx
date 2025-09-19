import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Settings, 
  BarChart3, 
  MessageSquare, 
  Play, 
  Send,
  UserPlus,
  Shuffle,
  Clock,
  Target,
  Crown,
  Trophy,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Trash,
  Loader2,
  XIcon,
  ChevronDown,
  MoreVertical
} from 'lucide-react';
import axios from 'axios';
import TournamentSchedule from './TournamentSchedule';
import TournamentResults from './TournamentResults';
import MatchScheduleModal from './MatchScheduleModal';
import RoundScheduleModal from './RoundScheduleModal';
import RoundSettingsModal from './RoundSettingsModal';

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
    _id?: string;
    name: string;
    participants: any[];
    round: number;
    groupLetter?: string;
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

interface TournamentDashboardProps {
  tournament: Tournament;
  onTournamentUpdated: () => void;
}

const TournamentDashboard: React.FC<TournamentDashboardProps> = ({
  tournament,
  onTournamentUpdated
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tournamentMessage, setTournamentMessage] = useState('');
  const [groupMessage, setGroupMessage] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedRound, setSelectedRound] = useState(1);
  const [showRoundSettings, setShowRoundSettings] = useState(false);
  const [showChannelView, setShowChannelView] = useState(false);
  const [channelGroup, setChannelGroup] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMessageInfo, setDeleteMessageInfo] = useState<{
    groupId: string;
    round: number;
    messageIndex: number;
  } | null>(null);
  const [showDeleteTournamentDialog, setShowDeleteTournamentDialog] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [localMessages, setLocalMessages] = useState<Record<string, any[]>>({});
  const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<number[]>([]);
  const [showMessageOptions, setShowMessageOptions] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteSelectedConfirm, setShowDeleteSelectedConfirm] = useState(false);
  const [roundSettings, setRoundSettings] = useState<Record<number, any>>({});
  const [showMatchScheduleModal, setShowMatchScheduleModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<any>(null);
  const [showRoundScheduleModal, setShowRoundScheduleModal] = useState(false);
  const [selectedRoundForSchedule, setSelectedRoundForSchedule] = useState(1);
  const [showAllParticipants, setShowAllParticipants] = useState(false);

  // Initialize round settings with tournament data
  useEffect(() => {
    if (tournament) {
      setRoundSettings(prev => ({
        ...prev,
        1: {
          roundNumber: 1,
          roundName: 'Round 1',
          teamsPerGroup: tournament.teamsPerGroup || 4,
          totalSlots: tournament.totalSlots || 16,
          numberOfGroups: Math.ceil((tournament.totalSlots || 16) / (tournament.teamsPerGroup || 4))
        }
      }));

      // Initialize local messages with tournament messages
      if (tournament.groupMessages) {
        const initialMessages: Record<string, any[]> = {};
        tournament.groupMessages.forEach(groupThread => {
          const key = `${groupThread.groupId}-${groupThread.round}`;
          initialMessages[key] = groupThread.messages || [];
        });
        setLocalMessages(initialMessages);
      } else {
        // Clear local messages when tournament changes
        setLocalMessages({});
      }
    }
  }, [tournament]);

  // Clear selections when switching channels
  useEffect(() => {
    setSelectedMessages([]);
    setShowCheckboxes(false);
    setShowMessageOptions(false);
    setShowMessageMenu(null);
  }, [channelGroup]);

  // Close message menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Don't close if clicking on the menu or its children
      if (showMessageMenu && !target.closest('.message-menu-container')) {
        setShowMessageMenu(null);
      }
      if (showMessageOptions && !target.closest('.message-options-container')) {
        setShowMessageOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMessageMenu, showMessageOptions]);

  const handleDeleteTournament = () => {
    setShowDeleteTournamentDialog(true);
  };

  const confirmDeleteTournament = async () => {
    if (deleteConfirmationText !== 'DELETE') return;

    try {
      setLoading(true);
      await axios.delete(`/api/tournaments/${tournament._id}`);
      // Redirect to tournaments page after successful deletion
      window.location.href = '/tournaments';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error deleting tournament');
    } finally {
      setLoading(false);
    }
  };

  const closeDeleteTournamentDialog = () => {
    setShowDeleteTournamentDialog(false);
    setDeleteConfirmationText('');
  };

  const handleCancelTournament = async () => {
    if (!window.confirm('Are you sure you want to cancel this tournament? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await axios.put(`/api/tournaments/${tournament._id}/cancel`);
      onTournamentUpdated();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error canceling tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRoundSettings = (round: number) => {
    setSelectedRound(round);
    setShowRoundSettings(true);
  };

  const handleSaveRoundSettings = async (roundData: any) => {
    try {
      setLoading(true);
      setError('');
      
      // Update local state
      setRoundSettings(prev => ({
        ...prev,
        [roundData.roundNumber]: roundData
      }));
      
      // Update tournament settings in backend
      await axios.put(`/api/tournaments/${tournament._id}/round-settings`, {
        round: roundData.roundNumber,
        roundName: roundData.roundName,
        teamsPerGroup: roundData.teamsPerGroup,
        totalSlots: roundData.totalSlots,
        numberOfGroups: roundData.numberOfGroups
      });
      
      // Recreate groups for Round 1 if settings changed
      if (roundData.roundNumber === 1) {
        await axios.post(`/api/tournaments/${tournament._id}/recreate-groups`, {
          teamsPerGroup: roundData.teamsPerGroup,
          totalSlots: roundData.totalSlots
        });
      }
      
      setSuccess('Round settings updated and groups recreated successfully!');
      onTournamentUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update round settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignParticipantToGroup = async (participantId: string, groupId: string, round: number = 1) => {
    if (!participantId) {
      setError('Invalid participant ID');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      if (!groupId) {
        // Remove from group
        await axios.post(`/api/tournaments/${tournament._id}/assign-participant`, {
          participantId,
          groupId: '',
          round
        });
        setSuccess('Participant removed from group successfully!');
      } else {
        // Assign to group
        await axios.post(`/api/tournaments/${tournament._id}/assign-participant`, {
          participantId,
          groupId,
          round
        });
        setSuccess('Participant assigned to group successfully!');
      }
      
      // Don't call onTournamentUpdated() to prevent redirects
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign participant');
    } finally {
      setLoading(false);
    }
  };

  // Statistics
  // For duo tournaments, only count teams (not individual participants)
  // For solo tournaments, count both individual participants and teams
  const totalParticipants = tournament.format === 'Solo' 
    ? tournament.participants.length + tournament.teams.length 
    : tournament.teams.length;
  console.log('Tournament data:', {
    participants: tournament.participants,
    teams: tournament.teams,
    totalParticipants,
    groups: tournament.groups
  });
  const completedMatches = tournament.matches.filter(m => m.status === 'Completed').length;
  const totalMatches = tournament.matches.length;
  const ongoingMatches = tournament.matches.filter(m => m.status === 'In Progress').length;

  const handleStartTournament = async () => {
    try {
      setLoading(true);
      await axios.put(`/api/tournaments/${tournament._id}`, { status: 'Ongoing' });
      setSuccess('Tournament started successfully!');
      onTournamentUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start tournament');
    } finally {
      setLoading(false);
    }
  };


  const handleAutoAssignGroups = async () => {
    try {
      setLoading(true);
      await axios.post(`/api/tournaments/${tournament._id}/assign-groups`);
      setSuccess('Groups assigned and broadcast channels created successfully!');
      // Don't call onTournamentUpdated() to prevent redirects
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign groups');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssignParticipant = async (participantId: string) => {
    if (!participantId) {
      setError('Invalid participant ID');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Assign to the first available group (let backend find it)
      await axios.post(`/api/tournaments/${tournament._id}/assign-participant`, {
        participantId,
        groupId: '', // Empty groupId triggers auto-assignment
        round: 1
      });
      
      setSuccess('Participant assigned to group successfully!');
      // Don't call onTournamentUpdated() to prevent redirects
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign participant to group');
    } finally {
      setLoading(false);
    }
  };

  const handleSendUniversalBroadcast = async () => {
    if (!tournamentMessage.trim()) return;
    
    try {
      setLoading(true);
      setError('');
      
      console.log('Starting universal broadcast...');
      console.log('Tournament groups:', tournament.groups);
      
      // Send to tournament-wide messages
      await axios.post(`/api/tournaments/${tournament._id}/tournament-message`, {
        message: tournamentMessage,
        type: 'announcement'
      });
      
      console.log('Tournament message sent successfully');
      
      // Send to all group channels (only if groups exist)
      if (tournament.groups && tournament.groups.length > 0) {
        console.log(`Sending to ${tournament.groups.length} groups...`);
        
        // Send to each group individually to ensure all get the message
        for (let i = 0; i < tournament.groups.length; i++) {
          const group = tournament.groups[i];
          try {
            console.log(`Sending to group ${i + 1}:`, group.name);
            await axios.post(`/api/tournaments/${tournament._id}/group-message`, {
              groupId: group._id || group.name,
              round: group.round || 1,
              message: tournamentMessage,
              type: 'announcement'
            });
            console.log(`Successfully sent to group ${i + 1}`);
          } catch (groupError: any) {
            console.error(`Failed to send to group ${i + 1}:`, groupError);
            // Continue with other groups even if one fails
          }
        }
      }
      
      setSuccess('Universal broadcast sent to all groups successfully!');
      setTournamentMessage('');
      // Don't call onTournamentUpdated() to prevent redirects
    } catch (err: any) {
      console.error('Universal broadcast error:', err);
      setError(err.response?.data?.message || 'Failed to send universal broadcast');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupMessages = async (groupId: string, round: number) => {
    try {
      const response = await axios.get(`/api/tournaments/${tournament._id}/group-messages`, {
        params: { groupId, round }
      });
      
      if (response.data.success) {
        const messageKey = `${groupId}-${round}`;
        setLocalMessages(prev => ({
          ...prev,
          [messageKey]: response.data.data.messages
        }));
      }
    } catch (error) {
      console.error('Error fetching group messages:', error);
    }
  };

  const handleSendGroupMessage = async () => {
    if (!groupMessage.trim()) return;
    
    // Use selectedGroup or channelGroup
    const targetGroup = selectedGroup || (channelGroup ? (channelGroup._id || channelGroup.name) : '');
    const targetRound = selectedRound || (channelGroup ? channelGroup.round : 1);
    
    if (!targetGroup) return;
    
    try {
      setLoading(true);
      await axios.post(`/api/tournaments/${tournament._id}/group-message`, {
        groupId: targetGroup,
        round: targetRound,
        message: groupMessage,
        type: 'announcement'
      });
      setSuccess('Group message sent successfully!');
      setGroupMessage('');
      
      // Refresh the group messages after sending
      if (channelGroup) {
        await fetchGroupMessages(targetGroup, targetRound);
      }
      
      // Also refresh tournament data to update message counts
      onTournamentUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send group message');
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteGroupMessage = (groupId: string, round: number, messageIndex: number) => {
    setDeleteMessageInfo({ groupId, round, messageIndex });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteMessage = async () => {
    if (!deleteMessageInfo) return;
    
    try {
      setLoading(true);
      await axios.delete(`/api/tournaments/${tournament._id}/group-message/${deleteMessageInfo.groupId}/${deleteMessageInfo.round}/${deleteMessageInfo.messageIndex}`);
      setSuccess('Message deleted successfully!');
      
      // Update local messages state for real-time UI update
      const messageKey = `${deleteMessageInfo.groupId}-${deleteMessageInfo.round}`;
      setLocalMessages(prev => {
        const currentMessages = prev[messageKey] || [];
        const updatedMessages = [...currentMessages];
        updatedMessages.splice(deleteMessageInfo.messageIndex, 1);
        return {
          ...prev,
          [messageKey]: updatedMessages
        };
      });
      
      setShowDeleteConfirm(false);
      setDeleteMessageInfo(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete message');
    } finally {
      setLoading(false);
    }
  };

  const cancelDeleteMessage = () => {
    setShowDeleteConfirm(false);
    setDeleteMessageInfo(null);
  };

  const handleMessageSelect = (messageIndex: number) => {
    setSelectedMessages(prev => {
      if (prev.includes(messageIndex)) {
        return prev.filter(index => index !== messageIndex);
      } else {
        return [...prev, messageIndex];
      }
    });
  };

  const handleSelectMessages = () => {
    // Just show checkboxes, don't select all by default
    setShowCheckboxes(true);
    setSelectedMessages([]);
  };

  const handleSelectAll = () => {
    const messageKey = `${channelGroup._id || channelGroup.name}-${channelGroup.round || 1}`;
    const localGroupMessages = localMessages[messageKey];
    const baseMessages = localGroupMessages || tournament.groupMessages?.find(
      gm => gm.groupId === (channelGroup._id || channelGroup.name) && gm.round === (channelGroup.round || 1)
    )?.messages || [];
    
    if (selectedMessages.length === baseMessages.length && baseMessages.length > 0) {
      // Deselect all
      setSelectedMessages([]);
    } else {
      // Select all
      setSelectedMessages(baseMessages.map((_, index) => index));
    }
  };

  const handleDeleteSelectedMessages = () => {
    if (selectedMessages.length === 0) return;
    setShowDeleteSelectedConfirm(true);
  };

  const confirmDeleteSelectedMessages = async () => {
    try {
      setLoading(true);
      // Delete messages in reverse order to maintain indices
      const sortedIndices = [...selectedMessages].sort((a, b) => b - a);
      
      for (const index of sortedIndices) {
        await axios.delete(`/api/tournaments/${tournament._id}/group-message/${channelGroup._id || channelGroup.name}/${channelGroup.round || 1}/${index}`);
      }
      
      setSuccess(`${selectedMessages.length} message${selectedMessages.length > 1 ? 's' : ''} deleted successfully!`);
      
      // Update local messages
      const messageKey = `${channelGroup._id || channelGroup.name}-${channelGroup.round || 1}`;
      setLocalMessages(prev => {
        const currentMessages = prev[messageKey] || [];
        const updatedMessages = [...currentMessages];
        sortedIndices.forEach(index => {
          updatedMessages.splice(index, 1);
        });
        return {
          ...prev,
          [messageKey]: updatedMessages
        };
      });
      
      setSelectedMessages([]);
      setShowCheckboxes(false);
      setShowMessageOptions(false);
      setShowDeleteSelectedConfirm(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete messages');
    } finally {
      setLoading(false);
    }
  };

  const cancelDeleteSelectedMessages = () => {
    setShowDeleteSelectedConfirm(false);
  };

  const handleClearChat = () => {
    setShowClearConfirm(true);
  };

  const confirmClearChat = async () => {
    try {
      setLoading(true);
      const messageKey = `${channelGroup._id || channelGroup.name}-${channelGroup.round || 1}`;
      const localGroupMessages = localMessages[messageKey];
      const baseMessages = localGroupMessages || tournament.groupMessages?.find(
        gm => gm.groupId === (channelGroup._id || channelGroup.name) && gm.round === (channelGroup.round || 1)
      )?.messages || [];
      
      // Delete all messages in reverse order
      for (let i = baseMessages.length - 1; i >= 0; i--) {
        await axios.delete(`/api/tournaments/${tournament._id}/group-message/${channelGroup._id || channelGroup.name}/${channelGroup.round || 1}/${i}`);
      }
      
      setSuccess('Chat cleared successfully!');
      
      // Clear local messages
      setLocalMessages(prev => ({
        ...prev,
        [messageKey]: []
      }));
      
      setSelectedMessages([]);
      setShowCheckboxes(false);
      setShowMessageOptions(false);
      setShowClearConfirm(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to clear chat');
    } finally {
      setLoading(false);
    }
  };

  const cancelClearChat = () => {
    setShowClearConfirm(false);
  };

  const handleScheduleMatches = async () => {
    try {
      setLoading(true);
      await axios.post(`/api/tournaments/${tournament._id}/schedule-matches`);
      setSuccess('Matches scheduled successfully!');
      onTournamentUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to schedule matches');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatch = () => {
    setEditingMatch(null);
    setShowMatchScheduleModal(true);
  };

  const handleCreateRoundSchedule = (round: number) => {
    setSelectedRoundForSchedule(round);
    setShowRoundScheduleModal(true);
  };

  const handleEditMatch = (match: any) => {
    setEditingMatch(match);
    setShowMatchScheduleModal(true);
  };

  const handleMatchSave = (matchData: any) => {
    setSuccess('Match saved successfully!');
    onTournamentUpdated();
  };

  const handleMatchDelete = async (matchId: string) => {
    if (!window.confirm('Are you sure you want to delete this match?')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`/api/tournaments/${tournament._id}/schedule/${matchId}`);
      setSuccess('Match deleted successfully!');
      onTournamentUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete match');
    } finally {
      setLoading(false);
    }
  };

  const handleMatchStart = async (matchId: string) => {
    try {
      setLoading(true);
      await axios.post(`/api/tournaments/${tournament._id}/start-match`, { matchId });
      setSuccess('Match started successfully!');
      onTournamentUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start match');
    } finally {
      setLoading(false);
    }
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
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'participants', label: 'All Participants', icon: Users },
    { id: 'groups', label: 'Rounds', icon: Target },
    { id: 'schedule', label: 'Match Schedule', icon: Calendar },
    { id: 'results', label: 'Results', icon: Trophy },
    { id: 'broadcast', label: 'Broadcast', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const renderOverview = () => (
    <div className="space-y-4 md:space-y-6">
      {/* Tournament Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-400">Total Teams</p>
              <p className="text-lg md:text-2xl font-bold text-white">{totalParticipants}/{tournament.totalSlots}</p>
            </div>
            <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-400">Teams per Group</p>
              <p className="text-lg md:text-2xl font-bold text-white">{tournament.teamsPerGroup}</p>
            </div>
            <Target className="h-6 w-6 md:h-8 md:w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-400">Total Rounds</p>
              <p className="text-lg md:text-2xl font-bold text-white">{tournament.totalRounds}</p>
            </div>
            <Target className="h-6 w-6 md:h-8 md:w-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-400">Prize Pool</p>
              <p className="text-lg md:text-2xl font-bold text-white">₹{tournament.prizePool.toLocaleString()}</p>
            </div>
            <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Tournament Schedule */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold text-white mb-4 flex items-center">
          <Calendar className="h-4 w-4 md:h-5 md:w-5 mr-2 text-blue-400" />
          Tournament Schedule
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div>
            <p className="text-xs md:text-sm text-gray-400">Start Date</p>
            <p className="text-sm md:text-base text-white font-medium">{formatDate(tournament.startDate)}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-400">End Date</p>
            <p className="text-sm md:text-base text-white font-medium">{formatDate(tournament.endDate)}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-400">Current Round</p>
            <p className="text-sm md:text-base text-white font-medium">Round {tournament.currentRound}</p>
          </div>
        </div>
      </div>

      {/* Groups Status Alert */}
      {(!tournament.groups || tournament.groups.length === 0) && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-yellow-400" />
              <div>
                <h4 className="text-sm md:text-base font-medium text-white">Groups Not Created</h4>
                <p className="text-xs md:text-sm text-gray-400">Create groups and broadcast channels to start managing your tournament</p>
              </div>
            </div>
            <button
              onClick={handleAutoAssignGroups}
              disabled={loading}
              className="px-3 py-2 md:px-4 md:py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs md:text-sm font-medium"
            >
              Create Now
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-purple-400" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column - Main Actions */}
          <div className="space-y-3">
            {(!tournament.groups || tournament.groups.length === 0) ? (
              <button
                onClick={handleAutoAssignGroups}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                <Target className="h-5 w-5" />
                <span>Create Groups & Channels</span>
              </button>
            ) : (
              <button
                onClick={handleAutoAssignGroups}
                disabled={loading || totalParticipants === 0}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                <Shuffle className="h-5 w-5" />
                <span>Auto Assign All Participants</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('broadcast')}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              <Send className="h-5 w-5" />
              <span>Send Broadcast</span>
            </button>
          </div>

          {/* Right Column - Round Groups */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Round Groups</h4>
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: tournament.totalRounds || 4 }, (_, i) => i + 1).map((round) => (
                <button
                  key={round}
                  onClick={() => handleCreateRoundSchedule(round)}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  <Target className="h-4 w-4" />
                  <span>Round {round}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Match Statistics */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-yellow-400" />
          Match Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{completedMatches}</div>
            <div className="text-sm text-gray-400">Completed Matches</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{ongoingMatches}</div>
            <div className="text-sm text-gray-400">Ongoing Matches</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{totalMatches}</div>
            <div className="text-sm text-gray-400">Total Matches</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderParticipants = () => (
    <div className="space-y-4 md:space-y-6">
      {/* Participants List - Collapsible */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 md:p-6">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowAllParticipants(!showAllParticipants)}
        >
          <h3 className="text-base md:text-lg font-semibold text-white flex items-center">
          <Users className="h-4 w-4 md:h-5 md:w-5 mr-2 text-blue-400" />
          All Participants ({totalParticipants})
        </h3>
          <div className={`transform transition-transform ${showAllParticipants ? 'rotate-180' : ''}`}>
            <ChevronDown className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
          </div>
        </div>
        
        {showAllParticipants && (
        
        <div className="space-y-4">
          {/* Individual Participants - Only show for Solo tournaments */}
          {tournament.format === 'Solo' && tournament.participants && tournament.participants.length > 0 ? (
            tournament.participants.map((participant, index) => {
              // Add null check for participant
              if (!participant) {
                return null;
              }
              
              // Debug: Log participant data
              console.log('Participant data:', participant);
              console.log('Participant keys:', Object.keys(participant));
              console.log('Participant username:', participant.username);
              console.log('Participant name:', participant.name);
              console.log('Participant profile:', participant.profile);
              
              // Find which group this participant is assigned to
              const assignedGroup = tournament.groups?.find(group => 
                group.participants?.some(p => p._id === participant._id)
              );
            
            return (
            <div key={participant._id || index} className="bg-gray-700/50 rounded-lg p-3 md:p-4">
              {/* Mobile Layout */}
              <div className="md:hidden space-y-3">
              <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    {participant.profile?.avatar ? (
                      <img 
                        src={participant.profile.avatar} 
                        alt={participant.username || participant.name || participant.displayName || 'Participant'}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold">
                          {(participant.username || 
                            participant.name || 
                            participant.displayName ||
                            participant.user?.username ||
                            participant.user?.name ||
                            participant.user?.profile?.displayName)?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm truncate">
                      {participant.profile?.displayName || 
                       participant.username || 
                       participant.name || 
                       participant.displayName ||
                       participant.user?.username ||
                       participant.user?.name ||
                       participant.user?.profile?.displayName ||
                       'Unknown Participant'}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      @{participant.username || 
                         participant.name || 
                         participant.user?.username ||
                         participant.user?.name ||
                         'unknown'}
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                    Player
                  </span>
                </div>
                
                {assignedGroup && (
                  <div className="text-xs text-blue-400">
                    Assigned to: {assignedGroup.name} (Round {assignedGroup.round || 1})
                  </div>
                )}
                
                <div className="flex flex-col space-y-2">
                  <select
                    value={assignedGroup ? `${assignedGroup._id || assignedGroup.name}-${assignedGroup.round || 1}` : ''}
                    onChange={(e) => {
                      if (e.target.value && participant._id) {
                        const [groupId, round] = e.target.value.split('-');
                        handleAssignParticipantToGroup(participant._id, groupId, parseInt(round) || 1);
                      }
                    }}
                    className="w-full bg-gray-600 text-white text-xs px-3 py-2 rounded border border-gray-500 focus:outline-none focus:border-blue-500"
                    disabled={loading}
                  >
                    <option value="">Select Group</option>
                    {tournament.groups && tournament.groups.length > 0 ? (
                      tournament.groups
                        .filter(group => group.round === 1)
                        .map((group, groupIndex) => (
                          <option key={groupIndex} value={`${group._id || group.name}-${group.round || 1}`}>
                            Round {group.round || 1} - {group.name}
                          </option>
                        ))
                    ) : (
                      <option disabled>No groups available</option>
                    )}
                  </select>
                  
                  <div className="flex space-x-2">
                    {!assignedGroup && (
                      <button
                        onClick={() => {
                          if (participant._id) {
                            handleAutoAssignParticipant(participant._id);
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                        disabled={loading}
                      >
                        Auto Assign
                      </button>
                    )}
                    
                    {assignedGroup && participant._id && (
                      <button
                        onClick={() => {
                          handleAssignParticipantToGroup(participant._id, '', 1);
                        }}
                        className="flex-1 px-3 py-2 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                        disabled={loading}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Desktop Layout */}
              <div className="hidden md:flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  {participant.profile?.avatar ? (
                    <img 
                      src={participant.profile.avatar} 
                      alt={participant.username || participant.name || participant.displayName || 'Participant'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold">
                        {(participant.username || 
                          participant.name || 
                          participant.displayName ||
                          participant.user?.username ||
                          participant.user?.name ||
                          participant.user?.profile?.displayName)?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-base truncate">
                    {participant.profile?.displayName || 
                     participant.username || 
                     participant.name || 
                     participant.displayName ||
                     participant.user?.username ||
                     participant.user?.name ||
                     participant.user?.profile?.displayName ||
                     'Unknown Participant'}
                  </div>
                    <div className="text-sm text-gray-400 truncate">
                    @{participant.username || 
                       participant.name || 
                       participant.user?.username ||
                       participant.user?.name ||
                       'unknown'}
                  </div>
                    {assignedGroup && (
                        <div className="text-xs text-blue-400 truncate">
                        Assigned to: {assignedGroup.name} (Round {assignedGroup.round || 1})
                      </div>
                    )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                  Player
                </span>
                  
                  {/* Group Assignment */}
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <select
                        value={assignedGroup ? `${assignedGroup._id || assignedGroup.name}-${assignedGroup.round || 1}` : ''}
                        onChange={(e) => {
                          if (e.target.value && participant._id) {
                            const [groupId, round] = e.target.value.split('-');
                            handleAssignParticipantToGroup(participant._id, groupId, parseInt(round) || 1);
                          }
                        }}
                        className="bg-gray-600 text-white text-xs px-3 py-2 rounded border border-gray-500 focus:outline-none focus:border-blue-500 min-w-[150px]"
                        disabled={loading}
                      >
                        <option value="">Select Group</option>
                        {tournament.groups && tournament.groups.length > 0 ? (
                          tournament.groups
                            .filter(group => group.round === 1) // Only show Round 1 groups
                            .map((group, groupIndex) => (
                              <option key={groupIndex} value={`${group._id || group.name}-${group.round || 1}`}>
                                Round {group.round || 1} - {group.name}
                              </option>
                            ))
                        ) : (
                          <option disabled>No groups available</option>
                        )}
                      </select>
                      
                      {!assignedGroup && (
                        <button
                          onClick={() => {
                            if (participant._id) {
                              handleAutoAssignParticipant(participant._id);
                            }
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          disabled={loading}
                        >
                          Auto Assign
                </button>
                      )}
                      
                      {assignedGroup && participant._id && (
                        <button
                          onClick={() => {
                            // Remove from group
                            handleAssignParticipantToGroup(participant._id, '', 1);
                          }}
                          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                          disabled={loading}
                        >
                          Remove
                        </button>
                      )}
                </div>
              </div>
            </div>
              </div>
            </div>
            );
            })
          ) : null}

          {/* Team Participants */}
          {tournament.teams && tournament.teams.length > 0 ? (
            tournament.teams.map((team, index) => {
              // Find which group this team is assigned to
              const assignedGroup = tournament.groups?.find(group => 
                group.participants?.some(p => p._id === team._id || p.toString() === team._id)
              );
              
              return (
            <div key={index} className="bg-gray-700/50 rounded-lg p-3 md:p-4">
              {/* Mobile Layout */}
              <div className="md:hidden space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    {team.profile?.avatar ? (
                      <img 
                        src={team.profile.avatar} 
                        alt={team.username || team.name || 'Team'}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold">
                        {team.username?.charAt(0).toUpperCase() || 'T'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm truncate">
                      {team.profile?.displayName || team.username || team.name || 'Unknown Team'}
                    </div>
                    <div className="text-xs text-gray-400 truncate">@{team.username || team.name || 'unknown'}</div>
                  </div>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                    Team
                  </span>
                </div>
                
                {assignedGroup && (
                  <div className="text-xs text-blue-400">
                    Assigned to: {assignedGroup.name} (Round {assignedGroup.round || 1})
                  </div>
                )}
                
                <div className="flex flex-col space-y-2">
                  <select
                    value={assignedGroup ? `${assignedGroup._id || assignedGroup.name}-${assignedGroup.round || 1}` : ''}
                    onChange={(e) => {
                      if (e.target.value && team._id) {
                        const [groupId, round] = e.target.value.split('-');
                        handleAssignParticipantToGroup(team._id, groupId, parseInt(round) || 1);
                      }
                    }}
                    className="w-full bg-gray-600 text-white text-xs px-3 py-2 rounded border border-gray-500 focus:outline-none focus:border-blue-500"
                    disabled={loading}
                  >
                    <option value="">Select Group</option>
                    {tournament.groups && tournament.groups.length > 0 ? (
                      tournament.groups
                        .filter(group => group.round === 1)
                        .map((group, groupIndex) => (
                          <option key={groupIndex} value={`${group._id || group.name}-${group.round || 1}`}>
                            Round {group.round || 1} - {group.name}
                          </option>
                        ))
                    ) : (
                      <option disabled>No groups available</option>
                    )}
                  </select>
                  
                  <div className="flex space-x-2">
                    {!assignedGroup && (
                      <button
                        onClick={() => {
                          if (team._id) {
                            handleAutoAssignParticipant(team._id);
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                        disabled={loading}
                      >
                        Auto Assign
                      </button>
                    )}
                    
                    {assignedGroup && team._id && (
                      <button
                        onClick={() => {
                          handleAssignParticipantToGroup(team._id, '', 1);
                        }}
                        className="flex-1 px-3 py-2 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                        disabled={loading}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Desktop Layout */}
              <div className="hidden md:flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                  {team.profile?.avatar ? (
                    <img 
                      src={team.profile.avatar} 
                          alt={team.username || team.name || 'Team'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold">
                          {team.username?.charAt(0).toUpperCase() || 'T'}
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-white">
                        {team.profile?.displayName || team.username || team.name || 'Unknown Team'}
                  </div>
                      <div className="text-sm text-gray-400">@{team.username || team.name || 'unknown'}</div>
                      {assignedGroup && (
                        <div className="text-xs text-blue-400">
                          Assigned to: {assignedGroup.name} (Round {assignedGroup.round || 1})
                        </div>
                      )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                  Team
                </span>
                    
                    {/* Group Assignment for Teams */}
                    <div className="flex items-center space-x-2">
                      <select
                        value={assignedGroup ? `${assignedGroup._id || assignedGroup.name}-${assignedGroup.round || 1}` : ''}
                        onChange={(e) => {
                          if (e.target.value && team._id) {
                            const [groupId, round] = e.target.value.split('-');
                            handleAssignParticipantToGroup(team._id, groupId, parseInt(round) || 1);
                          }
                        }}
                        className="bg-gray-600 text-white text-xs px-3 py-2 rounded border border-gray-500 focus:outline-none focus:border-blue-500 min-w-[150px]"
                        disabled={loading}
                      >
                        <option value="">Select Group</option>
                        {tournament.groups && tournament.groups.length > 0 ? (
                          tournament.groups
                            .filter(group => group.round === 1) // Only show Round 1 groups
                            .map((group, groupIndex) => (
                              <option key={groupIndex} value={`${group._id || group.name}-${group.round || 1}`}>
                                Round {group.round || 1} - {group.name}
                              </option>
                            ))
                        ) : (
                          <option disabled>No groups available</option>
                        )}
                      </select>
                      
                      {!assignedGroup && (
                        <button
                          onClick={() => {
                            if (team._id) {
                              handleAutoAssignParticipant(team._id);
                            }
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          disabled={loading}
                        >
                          Auto Assign
                </button>
                      )}
                      
                      {assignedGroup && team._id && (
                        <button
                          onClick={() => {
                            // Remove from group
                            handleAssignParticipantToGroup(team._id, '', 1);
                          }}
                          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                          disabled={loading}
                        >
                          Remove
                        </button>
                      )}
                </div>
              </div>
            </div>
                </div>
              );
            })
          ) : null}

          {/* Show message only if both participants and teams are empty */}
          {((tournament.format === 'Solo' && (!tournament.participants || tournament.participants.length === 0)) || 
            (tournament.format === 'Duo' && (!tournament.teams || tournament.teams.length === 0))) ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3" />
              <p>No participants registered yet</p>
              <p className="text-xs mt-2">Debug: participants.length = {tournament.participants?.length || 0}, teams.length = {tournament.teams?.length || 0}</p>
            </div>
          ) : null}
        </div>
        )}
      </div>

      
      {/* Round-wise Grouping */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2 text-green-400" />
          Round-wise Grouping
        </h3>
        
        <div className="space-y-4">
          {Array.from({ length: tournament.totalRounds || 1 }, (_, i) => i + 1).map(round => {
            // Filter groups by round and remove duplicates
            const roundGroups = tournament.groups?.filter((group, index, self) => 
              group.round === round && 
              self.findIndex(g => g.name === group.name && g.round === group.round) === index
            ) || [];
            const totalParticipantsInRound = roundGroups.reduce((sum, group) => sum + (group.participants?.length || 0), 0);
            
            return (
              <div key={round} className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-semibold text-white">Round {round}</h4>
                  <div className="text-sm text-gray-400">
                    {roundGroups.length} groups • {totalParticipantsInRound} participants
    </div>
                </div>
                
                {roundGroups.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {roundGroups.map((group, index) => (
                      <div key={index} className="bg-gray-600/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-white">{group.name}</h5>
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                            {group.participants?.length || 0}/{tournament.teamsPerGroup}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          {group.participants && group.participants.length > 0 ? (
                            group.participants.map((participantData: any, pIndex: number) => {
                              let participant;
                              if (typeof participantData === 'object' && participantData !== null) {
                                participant = participantData;
                              } else {
                                participant = [...tournament.participants, ...tournament.teams].find(p => 
                                  p._id === participantData || p._id === participantData.toString()
                                );
                              }
                              
                              return (
                                <div key={pIndex} className="flex items-center space-x-2 text-xs">
                                  <div className="w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold">
                                      {(participant?.username || participant?.name || 'U')?.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="text-gray-300 truncate">
                                    {participant?.profile?.displayName || participant?.username || participant?.name || 'Unknown'}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-xs text-gray-500">No participants</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400">
                    <Target className="h-8 w-8 mx-auto mb-2" />
                    <p>No groups created for Round {round}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Round Groups Component
  const RoundGroups = ({ round, groups, tournament, onOpenSettings, roundSettings }: { 
    round: number; 
    groups: any[]; 
    tournament: any; 
    onOpenSettings: () => void;
    roundSettings?: any;
  }) => {
    const [isExpanded, setIsExpanded] = useState(round === 1); // Expand first round by default

    const roundName = roundSettings?.roundName || `Round ${round}`;
    const hasGroups = groups.length > 0;

    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg">
        {/* Round Header */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">{round}</span>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">{roundName}</h4>
                <p className="text-sm text-gray-400">
                  {hasGroups ? `${groups.length} groups` : 'No groups created'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {hasGroups && (
                <div className="text-right">
                  <div className="text-sm text-gray-400">Total Participants</div>
                  <div className="text-white font-medium">
                    {groups.reduce((sum, group) => sum + (group.participants?.length || 0), 0)} / {groups.length * tournament.teamsPerGroup}
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenSettings();
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Round Settings"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Groups Grid - Expandable */}
        {isExpanded && (
          <div className="px-4 pb-4">
            {hasGroups ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {groups.map((group, index) => (
                  <div key={index} className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-white">{group.groupLetter || group.name}</h5>
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                        {group.participants?.length || 0}/{tournament.teamsPerGroup}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-gray-400 mb-2">
                        {group.participants?.length === 0 
                          ? 'No participants assigned' 
                          : `${group.participants.length} participants assigned`
                        }
                      </p>
                      
                      {/* Participants List */}
                      {group.participants && group.participants.length > 0 ? (
                        <div className="space-y-1">
                          {group.participants.map((participantData: any, pIndex: number) => {
                            // Check if participantData is an object (already populated) or just an ID
                            let participant;
                            
                            if (typeof participantData === 'object' && participantData !== null) {
                              // participantData is already a participant object
                              participant = participantData;
                            } else {
                              // participantData is just an ID, find the actual participant
                              participant = [...tournament.participants, ...tournament.teams].find(p => 
                                p._id === participantData || p._id === participantData.toString()
                              );
                            }
                            
                            // Debug: Log group participant data
                            console.log('Group participant data:', participantData);
                            console.log('Found participant:', participant);
                            
                            if (!participant) {
                              return (
                                <div key={pIndex} className="flex items-center space-x-2 text-sm bg-red-500/10 rounded p-2">
                                  <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">?</span>
                                  </div>
                                  <span className="text-red-300 truncate text-xs font-medium">
                                    Participant not found (ID: {participantData})
                                  </span>
                                </div>
                              );
                            }
                            
                            return (
                              <div key={participant._id || pIndex} className="flex items-center space-x-2 text-sm bg-green-500/10 rounded p-2">
                              <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-white">
                                  {(participant.username || 
                                    participant.name || 
                                    participant.displayName ||
                                    participant.user?.username ||
                                    participant.user?.name ||
                                    participant.user?.profile?.displayName)?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              </div>
                              <span className="text-green-300 truncate text-xs font-medium">
                                {participant.profile?.displayName || 
                                 participant.username || 
                                 participant.name || 
                                 participant.displayName ||
                                 participant.user?.username ||
                                 participant.user?.name ||
                                 participant.user?.profile?.displayName ||
                                 'Unknown'}
                              </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-3 text-gray-500 bg-gray-600/20 rounded">
                          <Users className="h-6 w-6 mx-auto mb-1" />
                          <p className="text-xs">No participants assigned</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1">
                        <UserPlus className="h-3 w-3" />
                        <span>Add</span>
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedGroup(group._id || group.name);
                          setSelectedRound(round);
                          setActiveTab('broadcast');
                        }}
                        className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
                        title="Open broadcast channel for this group"
                      >
                        <MessageSquare className="h-3 w-3" />
                      </button>
                </div>
              </div>
            ))}
          </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-white mb-2">No Groups Created</h4>
                <p className="text-gray-400 mb-4">
                  {round === 1 
                    ? 'Create groups for Round 1 to get started' 
                    : 'Configure this round settings to create groups'
                  }
                </p>
                {round === 1 ? (
                  <button
                    onClick={handleAutoAssignGroups}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Create Groups
                  </button>
                ) : (
                  <button
                    onClick={onOpenSettings}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Configure Round
                  </button>
                )}
              </div>
            )}
        </div>
      )}
    </div>
  );
  };

  const renderGroups = () => {
    // Group groups by round and remove duplicates
    const groupsByRound = tournament.groups?.reduce((acc, group) => {
      const round = group.round || 1;
      if (!acc[round]) {
        acc[round] = [];
      }
      // Check if group already exists (by name and round)
      const exists = acc[round].some(g => g.name === group.name && g.round === group.round);
      if (!exists) {
      acc[round].push(group);
      }
      return acc;
    }, {} as Record<number, any[]>) || {};

    // Create all rounds (1 to totalRounds)
    const allRounds = Array.from({ length: tournament.totalRounds || 1 }, (_, i) => i + 1);

    return (
      <div className="space-y-4 md:space-y-6">
        {/* Groups Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          <div>
            <h3 className="text-lg md:text-2xl font-bold text-white flex items-center">
              <Target className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3 text-blue-400" />
              Tournament Rounds ({tournament.totalRounds || 1})
            </h3>
            <p className="text-sm md:text-base text-gray-400 mt-1">
              Manage rounds and group assignments
            </p>
          </div>
          {(!tournament.groups || tournament.groups.length === 0) ? (
            <button
              onClick={handleAutoAssignGroups}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 md:px-6 md:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-base font-semibold"
            >
              <Target className="h-4 w-4 md:h-5 md:w-5" />
              <span>Create Groups</span>
            </button>
          ) : (
            <button
              onClick={handleAutoAssignGroups}
              disabled={loading || totalParticipants === 0}
              className="flex items-center space-x-2 px-3 py-2 md:px-4 md:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs md:text-sm font-medium"
            >
              <Shuffle className="h-3 w-3 md:h-4 md:w-4" />
              <span>Auto Assign</span>
            </button>
          )}
        </div>

        {/* All Rounds */}
        <div className="space-y-6">
          {allRounds.map((round) => (
            <RoundGroups 
              key={round} 
              round={round} 
              groups={groupsByRound[round] || []} 
              tournament={tournament}
              onOpenSettings={() => handleOpenRoundSettings(round)}
              roundSettings={roundSettings[round]}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderSchedule = () => (
    <div className="space-y-4 md:space-y-6">
    <TournamentSchedule 
      tournament={tournament} 
      isHost={true}
      onTournamentUpdated={onTournamentUpdated}
    />
    </div>
  );

  const renderResults = () => (
    <div className="space-y-4 md:space-y-6">
    <TournamentResults 
      tournament={tournament as any} 
      isHost={true}
      onTournamentUpdated={onTournamentUpdated}
    />
    </div>
  );

  const renderResultsOld = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
          <Trophy className="h-6 w-6 mr-3 text-yellow-400" />
          Tournament Results
        </h2>
        <p className="text-gray-400 mb-6">
          View and manage tournament results, team standings, and qualifications.
        </p>
        
        {/* Round Selector */}
        <div className="flex space-x-2 mb-6">
          {Array.from({ length: tournament.totalRounds }, (_, i) => (
            <button
              key={i + 1}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                i + 1 === 1
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              Round {i + 1}
            </button>
          ))}
        </div>

        {/* Overall Standings */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">
            OVERALL STANDINGS
          </h3>
          <div className="text-yellow-400 text-sm mb-6">
            ROUND 1 | DAY 1
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-3 px-4 text-white">RANK</th>
                  <th className="text-left py-3 px-4 text-white">TEAM</th>
                  <th className="text-center py-3 px-4 text-white">🍗</th>
                  <th className="text-center py-3 px-4 text-white">FIN.PTS</th>
                  <th className="text-center py-3 px-4 text-white">POS.PTS</th>
                  <th className="text-center py-3 px-4 text-white">TOT.PTS</th>
                  <th className="text-center py-3 px-4 text-white">QUALIFY</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-700 bg-yellow-500/10">
                  <td className="py-3 px-4 text-white font-bold">1</td>
                  <td className="py-3 px-4 text-white flex items-center space-x-2">
                    <div className="w-6 h-6 bg-yellow-500 rounded flex items-center justify-center text-black font-bold text-xs">
                      A
                    </div>
                    <span>Sample Team 1</span>
                  </td>
                  <td className="py-3 px-4 text-center text-white">3</td>
                  <td className="py-3 px-4 text-center text-white">79</td>
                  <td className="py-3 px-4 text-center text-white">57</td>
                  <td className="py-3 px-4 text-center text-white font-bold">136</td>
                  <td className="py-3 px-4 text-center">
                    <button className="w-6 h-6 rounded border-2 bg-green-500 border-green-500 text-white flex items-center justify-center">
                      ✓
                    </button>
                  </td>
                </tr>
                <tr className="border-b border-gray-700 bg-yellow-500/10">
                  <td className="py-3 px-4 text-white font-bold">2</td>
                  <td className="py-3 px-4 text-white flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-xs">
                      B
                    </div>
                    <span>Sample Team 2</span>
                  </td>
                  <td className="py-3 px-4 text-center text-white">2</td>
                  <td className="py-3 px-4 text-center text-white">84</td>
                  <td className="py-3 px-4 text-center text-white">48</td>
                  <td className="py-3 px-4 text-center text-white font-bold">132</td>
                  <td className="py-3 px-4 text-center">
                    <button className="w-6 h-6 rounded border-2 bg-green-500 border-green-500 text-white flex items-center justify-center">
                      ✓
                    </button>
                  </td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-3 px-4 text-white font-bold">3</td>
                  <td className="py-3 px-4 text-white flex items-center space-x-2">
                    <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center text-white font-bold text-xs">
                      C
                    </div>
                    <span>Sample Team 3</span>
                  </td>
                  <td className="py-3 px-4 text-center text-white">1</td>
                  <td className="py-3 px-4 text-center text-white">78</td>
                  <td className="py-3 px-4 text-center text-white">48</td>
                  <td className="py-3 px-4 text-center text-white font-bold">126</td>
                  <td className="py-3 px-4 text-center">
                    <button className="w-6 h-6 rounded border-2 border-gray-400 text-gray-400 flex items-center justify-center">
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Group Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-4">
              GROUP A RESULTS
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded bg-yellow-500/10">
                <div className="flex items-center space-x-3">
                  <span className="text-white font-bold w-8">1</span>
                  <div className="w-6 h-6 bg-yellow-500 rounded flex items-center justify-center text-black font-bold text-xs">
                    A
                  </div>
                  <span className="text-white">Sample Team 1</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-300">
                  <span>3🍗</span>
                  <span>79</span>
                  <span>57</span>
                  <span className="font-bold text-white">136</span>
                </div>
                <button className="w-6 h-6 rounded border-2 bg-green-500 border-green-500 text-white flex items-center justify-center">
                  ✓
                </button>
              </div>
              <div className="flex items-center justify-between p-3 rounded bg-gray-700/50">
                <div className="flex items-center space-x-3">
                  <span className="text-white font-bold w-8">2</span>
                  <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-xs">
                    B
                  </div>
                  <span className="text-white">Sample Team 2</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-300">
                  <span>2🍗</span>
                  <span>84</span>
                  <span>48</span>
                  <span className="font-bold text-white">132</span>
                </div>
                <button className="w-6 h-6 rounded border-2 bg-green-500 border-green-500 text-white flex items-center justify-center">
                  ✓
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-4">
              GROUP B RESULTS
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded bg-yellow-500/10">
                <div className="flex items-center space-x-3">
                  <span className="text-white font-bold w-8">1</span>
                  <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center text-white font-bold text-xs">
                    C
                  </div>
                  <span className="text-white">Sample Team 3</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-300">
                  <span>1🍗</span>
                  <span>78</span>
                  <span>48</span>
                  <span className="font-bold text-white">126</span>
                </div>
                <button className="w-6 h-6 rounded border-2 border-gray-400 text-gray-400 flex items-center justify-center">
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Qualification Summary */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            Round 1 Qualification Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">20</div>
              <div className="text-gray-400 text-sm">Total Groups</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">8</div>
              <div className="text-gray-400 text-sm">Qualified per Group</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">160</div>
              <div className="text-gray-400 text-sm">Total Qualified</div>
            </div>
          </div>
          <div className="text-center">
            <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
              Proceed to Round 2
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChannelView = () => {
    if (!channelGroup) return null;
    
    const groupThread = tournament.groupMessages?.find(
      gm => gm.groupId === (channelGroup._id || channelGroup.name) && gm.round === channelGroup.round
    );
    
    // Use tournament messages directly (they are already updated after broadcast)
    const baseMessages = groupThread?.messages || [];
    
    // Sort messages by timestamp (most recent first)
    const messages = baseMessages.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    const participantCount = channelGroup.participants?.length || 0;
    
    return (
      <div className="space-y-6">
        {/* Channel Header */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setShowChannelView(false);
                  setChannelGroup(null);
                }}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="Back to Broadcast Channels"
              >
                <ArrowLeft className="h-4 w-4 text-gray-400 hover:text-white" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{channelGroup.name}</h2>
                  <p className="text-xs text-gray-400">Round {channelGroup.round} • {participantCount} participants</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-xs text-blue-400 font-medium">Active</span>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg">
          {/* Messages Header */}
          <div className="border-b border-gray-700 px-6 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Messages</h3>
              <div className="flex items-center space-x-2">
                {selectedMessages.length > 0 ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-blue-400 font-medium">{selectedMessages.length} selected</span>
                    <button
                      onClick={handleSelectAll}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors flex items-center space-x-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      <span>Select All</span>
                    </button>
                    <button
                      onClick={handleDeleteSelectedMessages}
                      disabled={loading}
                      className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-1"
                    >
                      <Trash className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedMessages([]);
                        setShowCheckboxes(false);
                      }}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors flex items-center space-x-1"
                    >
                      <XIcon className="h-3 w-3" />
                      <span>Cancel</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
                    <div className="relative">
                      <button
                        onClick={() => setShowMessageOptions(!showMessageOptions)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Message options"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </button>
                      
                      {/* 3 Dots Menu */}
                      {showMessageOptions && (
                        <div className="message-options-container absolute right-0 top-10 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-[150px]">
                          <button
                            onClick={() => {
                              handleSelectMessages();
                              setShowMessageOptions(false);
                            }}
                            className="w-full px-3 py-2 text-left text-white hover:bg-gray-700 rounded-lg flex items-center space-x-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Select Messages</span>
                          </button>
                          <button
                            onClick={() => {
                              handleClearChat();
                              setShowMessageOptions(false);
                            }}
                            className="w-full px-3 py-2 text-left text-red-400 hover:bg-red-500/20 rounded-lg flex items-center space-x-2"
                          >
                            <Trash className="h-4 w-4" />
                            <span>Clear Chat</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages List */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.length > 0 ? (
              messages.map((msg, index) => {
                const messageId = `${channelGroup._id || channelGroup.name}-${channelGroup.round || 1}-${index}`;
                const isSelected = selectedMessages.includes(index);
                return (
                  <div key={index} className={`flex space-x-3 group hover:bg-gray-700/50 rounded-lg p-2 -m-2 relative ${isSelected ? 'bg-blue-500/10 border border-blue-500/30' : ''}`}>
                    {/* Selection Checkbox - Only show when in selection mode */}
                    {showCheckboxes && (
                      <div className="flex items-start pt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleMessageSelect(index)}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </div>
                    )}
                    
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-white">
                        {(msg.sender?.profile?.displayName || msg.sender?.username || 'Host').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-white">
                            {msg.sender?.profile?.displayName || msg.sender?.username || 'Host'}
                          </span>
                          {msg.type === 'announcement' && (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                              Announcement
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(msg.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="relative">
                          <button
                            onClick={() => setShowMessageMenu(showMessageMenu === messageId ? null : messageId)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-600/50 rounded text-gray-400 hover:text-white"
                            title="Message options"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          
                          {/* 3 Dots Menu */}
                          {showMessageMenu === messageId && (
                            <div className="message-menu-container absolute right-0 top-8 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Delete button clicked for message:', index);
                                  
                                  // Set the delete info first
                                  setDeleteMessageInfo({
                                    groupId: channelGroup._id || channelGroup.name,
                                    round: channelGroup.round || 1,
                                    messageIndex: index
                                  });
                                  
                                  // Close menu and show confirmation dialog
                                  setShowMessageMenu(null);
                                  setShowDeleteConfirm(true);
                                  
                                  console.log('Delete confirmation should show now');
                                }}
                                className="w-full px-3 py-2 text-left text-red-400 hover:bg-red-500/20 rounded-lg flex items-center space-x-2"
                              >
                                <Trash className="h-4 w-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-200 text-sm leading-relaxed">{msg.message}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-gray-400">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm">Start the conversation below</p>
              </div>
            )}
          </div>
        </div>

        {/* Send Message Area */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-2">
          <div className="flex space-x-2">
            <div className="flex-1">
              <textarea
                value={groupMessage}
                onChange={(e) => setGroupMessage(e.target.value)}
                placeholder={`Message ${channelGroup.name}...`}
                className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                rows={1}
              />
            </div>
            <button
              onClick={handleSendGroupMessage}
              disabled={loading || !groupMessage.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )}
              <span className="text-sm">Send</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderBroadcast = () => (
    <div className="space-y-4 md:space-y-6">
      {/* Individual Group Broadcast Channels */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 md:p-6">
        <div className="flex items-center space-x-2 md:space-x-3 mb-4">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Users className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-semibold text-white">Individual Group Broadcast Channels</h3>
            <p className="text-gray-400 text-xs md:text-sm">Each group has its own broadcast channel for targeted communication</p>
        </div>
      </div>

        {/* Group Broadcast Channels Grid */}
        {tournament.groups && tournament.groups.length > 0 ? (
          <div className="space-y-6">
            {(() => {
              // Group groups by round and remove duplicates
              const groupsByRound = tournament.groups.reduce((acc, group) => {
                const round = group.round || 1;
                if (!acc[round]) acc[round] = [];
                // Check if group already exists (by name and round)
                const exists = acc[round].some(g => g.name === group.name && g.round === group.round);
                if (!exists) {
                acc[round].push(group);
                }
                return acc;
              }, {} as Record<number, any[]>);

              return Object.entries(groupsByRound).map(([round, groups]) => (
                <div key={round} className="space-y-3 md:space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs md:text-sm font-bold">{round}</span>
    </div>
                    <h4 className="text-base md:text-lg font-semibold text-white">Round {round} Broadcast Channels</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                    {groups.map((group, index) => {
                      const participantCount = group.participants?.length || 0;
                      const groupId = group._id || group.name;
                      const groupThread = tournament.groupMessages?.find(
                        gm => gm.groupId === groupId && gm.round === parseInt(round)
                      );
                      
                      // Always use tournament messages for count display (persistent across refreshes)
                      const messageCount = groupThread?.messages?.length || 0;
                      
                      return (
                        <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-700 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                <MessageSquare className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <h5 className="font-semibold text-white">{group.name}</h5>
                                <p className="text-xs text-gray-400">{participantCount} participants</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-400">Messages</div>
                              <div className="text-white font-semibold">{messageCount}</div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">Status</span>
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                <span className="text-blue-400 text-xs font-medium">Active</span>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <button
                                onClick={async () => {
                                  const groupId = group._id || group.name;
                                  const groupRound = parseInt(round);
                                  
                                  setChannelGroup({
                                    ...group,
                                    round: groupRound
                                  });
                                  setShowChannelView(true);
                                  
                                  // Fetch messages for this group
                                  await fetchGroupMessages(groupId, groupRound);
                                }}
                                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                              >
                                <MessageSquare className="h-3 w-3" />
                                <span>Open Channel</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedGroup(group._id || group.name);
                                  setSelectedRound(parseInt(round));
                                }}
                                className="px-3 py-2 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
                                title="Send broadcast to this group"
                              >
                                <Send className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <MessageSquare className="h-12 w-12 mx-auto mb-3" />
            <p>No groups created yet. Create groups to enable individual broadcast channels.</p>
          </div>
        )}
      </div>

      {/* Universal Tournament Broadcast */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Universal Tournament Broadcast</h3>
            <p className="text-gray-400 text-sm">Send broadcast to all tournament participants</p>
          </div>
        </div>
        <div className="space-y-4">
          <textarea
            value={tournamentMessage}
            onChange={(e) => setTournamentMessage(e.target.value)}
            placeholder="Type your tournament message here..."
            className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:outline-none focus:border-blue-500 resize-none"
            rows={4}
          />
          <button
            onClick={handleSendUniversalBroadcast}
            disabled={loading || !tournamentMessage.trim()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            <span>Send Universal Broadcast</span>
          </button>
        </div>
      </div>


    </div>
  );

  const renderSettings = () => (
    <div className="space-y-4 md:space-y-6">
      {/* Tournament Information */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold text-white mb-4 flex items-center">
          <Settings className="h-4 w-4 md:h-5 md:w-5 mr-2 text-blue-400" />
          Tournament Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-300 mb-2">Tournament Name</label>
            <input
              type="text"
              value={tournament.name}
              disabled
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm md:text-base text-white"
            />
          </div>
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-300 mb-2">Game</label>
            <input
              type="text"
              value={tournament.game}
              disabled
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm md:text-base text-white"
            />
          </div>
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-300 mb-2">Format</label>
            <input
              type="text"
              value={tournament.format}
              disabled
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm md:text-base text-white"
            />
          </div>
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-300 mb-2">Status</label>
            <div className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium ${getStatusColor(tournament.status)}`}>
              {tournament.status}
            </div>
          </div>
        </div>
      </div>

      {/* Tournament Schedule */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold text-white mb-4 flex items-center">
          <Calendar className="h-4 w-4 md:h-5 md:w-5 mr-2 text-green-400" />
          Tournament Schedule
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-300 mb-2">Start Date</label>
            <input
              type="datetime-local"
              value={new Date(tournament.startDate).toISOString().slice(0, 16)}
              disabled
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm md:text-base text-white"
            />
          </div>
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-300 mb-2">End Date</label>
            <input
              type="datetime-local"
              value={new Date(tournament.endDate).toISOString().slice(0, 16)}
              disabled
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm md:text-base text-white"
            />
          </div>
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-300 mb-2">Registration Deadline</label>
            <input
              type="datetime-local"
              value={new Date(tournament.registrationDeadline).toISOString().slice(0, 16)}
              disabled
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm md:text-base text-white"
            />
          </div>
        </div>
      </div>

      {/* Tournament Configuration */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2 text-purple-400" />
          Tournament Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Total Slots</label>
            <input
              type="number"
              value={tournament.totalSlots}
              disabled
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Teams per Group</label>
            <input
              type="number"
              value={tournament.teamsPerGroup}
              disabled
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Number of Groups</label>
            <input
              type="number"
              value={tournament.numberOfGroups}
              disabled
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Total Rounds</label>
            <input
              type="number"
              value={tournament.totalRounds}
              disabled
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>
      </div>

      {/* Prize Pool Settings */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Crown className="h-5 w-5 mr-2 text-yellow-400" />
          Prize Pool Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Prize Pool Type</label>
            <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
              tournament.prizePoolType === 'with_prize' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }`}>
              {tournament.prizePoolType === 'with_prize' ? 'With Prize Pool' : 'Free Entry'}
            </div>
          </div>
          {tournament.prizePoolType === 'with_prize' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Prize Pool Amount</label>
                <input
                  type="number"
                  value={tournament.prizePool}
                  disabled
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Entry Fee</label>
                <input
                  type="number"
                  value={tournament.entryFee}
                  disabled
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tournament Actions */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-red-400" />
          Tournament Actions
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <Trash className="h-5 w-5 text-red-400" />
          </div>
              <div>
                <h4 className="font-medium text-white">Delete Tournament</h4>
                <p className="text-sm text-gray-400">Permanently delete this tournament and all its data. This action cannot be undone.</p>
                <p className="text-xs text-red-400 mt-1">⚠️ This will permanently remove all tournament data</p>
              </div>
            </div>
            <button
              onClick={handleDeleteTournament}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Deleting...' : 'Delete Tournament'}
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <XCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <h4 className="font-medium text-white">Cancel Tournament</h4>
                <p className="text-sm text-gray-400">Cancel the tournament and notify all participants. Tournament will be marked as cancelled.</p>
                <p className="text-xs text-yellow-400 mt-1">⚠️ Cannot cancel completed tournaments</p>
              </div>
            </div>
            <button
              onClick={handleCancelTournament}
              disabled={loading || tournament.status === 'Completed' || tournament.status === 'Cancelled'}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Canceling...' : 'Cancel Tournament'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black pt-4 md:pt-24">
      {/* Mobile Header */}
      <div className="md:hidden bg-black/95 backdrop-blur-sm border-b border-gray-800 shadow-lg fixed top-0 left-0 right-0 z-50 p-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/tournaments')}
            className="p-1 hover:bg-gray-700 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white">Tournament Management</h1>
        </div>
      </div>

      {/* Add top padding for mobile header */}
      <div className="pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 md:py-8">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          {/* Desktop Back Button */}
          <div className="hidden md:block mb-4">
            <button
              onClick={() => navigate('/tournaments')}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Tournaments</span>
            </button>
          </div>
          
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-3 md:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <Crown className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
            <div className="flex-1 min-w-0">
                  <h1 className="text-xl md:text-3xl font-bold text-white truncate">{tournament.name}</h1>
                  <p className="text-sm md:text-base text-gray-400 truncate">{tournament.description}</p>
                </div>
            </div>
            <div className="text-left md:text-right">
                <div className={`inline-block px-3 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium ${getStatusColor(tournament.status)}`}>
                {tournament.status}
              </div>
              <div className="text-xs md:text-sm text-gray-400 mt-1">
                {tournament.game} • {tournament.format}
                </div>
              <div className="mt-3">
                <button
                  onClick={handleStartTournament}
                  disabled={loading || tournament.status !== 'Registration Open'}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  <Play className="h-4 w-4" />
                  <span>Start Tournament</span>
                </button>
              </div>
              </div>
            </div>
            
            {/* Tournament Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 md:p-3 text-center">
                <div className="text-lg md:text-xl font-bold text-white">{tournament.totalSlots}</div>
                <div className="text-xs md:text-sm text-gray-400">Total Slots</div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 md:p-3 text-center">
                <div className="text-lg md:text-xl font-bold text-white">{totalParticipants}</div>
                <div className="text-xs md:text-sm text-gray-400">Participants</div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 md:p-3 text-center">
                <div className="text-lg md:text-xl font-bold text-white">{tournament.groups?.length || 0}</div>
                <div className="text-xs md:text-sm text-gray-400">Groups</div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 md:p-3 text-center">
                <div className="text-lg md:text-xl font-bold text-white">{tournament.totalRounds || 1}</div>
                <div className="text-xs md:text-sm text-gray-400">Rounds</div>
              </div>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-500/20 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-800 mb-4 md:mb-6">
          <nav className="flex overflow-x-auto space-x-2 md:space-x-8 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setShowChannelView(false); // Close channel view when switching tabs
                    setChannelGroup(null);
                  }}
                  className={`flex items-center space-x-1 md:space-x-2 py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                  }`}
                >
                  <Icon className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {showChannelView ? (
            renderChannelView()
          ) : (
            <>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'participants' && renderParticipants()}
              {activeTab === 'groups' && renderGroups()}
          {activeTab === 'schedule' && renderSchedule()}
          {activeTab === 'results' && renderResults()}
          {activeTab === 'broadcast' && renderBroadcast()}
          {activeTab === 'settings' && renderSettings()}
            </>
          )}
        </div>
      </div>

      {/* Round Settings Modal */}
      <RoundSettingsModal
        isOpen={showRoundSettings}
        onClose={() => setShowRoundSettings(false)}
        round={selectedRound}
        totalRounds={tournament.totalRounds || 1}
        onSave={handleSaveRoundSettings}
        initialData={roundSettings[selectedRound]}
      />

      {/* Match Schedule Modal */}
      <MatchScheduleModal
        isOpen={showMatchScheduleModal}
        onClose={() => {
          setShowMatchScheduleModal(false);
          setEditingMatch(null);
        }}
        tournament={tournament}
        match={editingMatch}
        onSave={handleMatchSave}
      />

      {/* Round Schedule Modal */}
      <RoundScheduleModal
        isOpen={showRoundScheduleModal}
        onClose={() => {
          setShowRoundScheduleModal(false);
          setSelectedRoundForSchedule(1);
        }}
        tournament={tournament}
        round={selectedRoundForSchedule}
        onSave={(scheduleData) => {
          setSuccess(`Round ${scheduleData.round} schedule created with ${scheduleData.totalMatches} matches!`);
          onTournamentUpdated();
        }}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <XIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete message?</h3>
                <p className="text-gray-400 text-sm">This message will be deleted for everyone.</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={confirmDeleteMessage}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XIcon className="h-4 w-4 mr-2" />
                )}
                <span>Delete</span>
              </button>
              <button
                onClick={cancelDeleteMessage}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Selected Messages Confirmation Dialog */}
      {showDeleteSelectedConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <Trash className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete selected messages?</h3>
                <p className="text-gray-400 text-sm">Are you sure you want to delete {selectedMessages.length} selected message{selectedMessages.length > 1 ? 's' : ''}? This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={confirmDeleteSelectedMessages}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash className="h-4 w-4" />
                )}
                <span>Delete</span>
              </button>
              <button
                onClick={cancelDeleteSelectedMessages}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Chat Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <Trash className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Clear all messages?</h3>
                <p className="text-gray-400 text-sm">This will delete all messages in this chat. This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={confirmClearChat}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash className="h-4 w-4" />
                )}
                <span>Clear All</span>
              </button>
              <button
                onClick={cancelClearChat}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Tournament Dialog */}
      {showDeleteTournamentDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border-2 border-gray-600">
            {/* Header */}
            <div className="bg-gray-700 px-6 py-4 rounded-t-xl border-b border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Delete Tournament</h3>
                <button
                  onClick={closeDeleteTournamentDialog}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  <Trash className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <Trash className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">Permanent Deletion</h4>
                  <p className="text-gray-300 text-sm">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-white text-sm mb-2">
                  This will permanently delete the tournament and <span className="font-bold text-red-400">ALL</span> its data.
                </p>
                <p className="text-gray-300 text-sm mb-4">
                  Type <span className="font-bold text-white">"DELETE"</span> to confirm:
                </p>
                
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="Type DELETE here..."
                  className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-500 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                  autoFocus
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeDeleteTournamentDialog}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-semibold transition-all duration-200 hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteTournament}
                  disabled={deleteConfirmationText !== 'DELETE' || loading}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    deleteConfirmationText === 'DELETE' && !loading
                      ? 'bg-red-600 hover:bg-red-700 text-white hover:scale-105'
                      : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Deleting...' : 'OK'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default TournamentDashboard;
