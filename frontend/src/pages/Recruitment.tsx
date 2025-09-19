import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, UserPlus, Search, Filter, Plus, Gamepad2, Shield, Briefcase, Home, Trophy, MessageCircle } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import CreateTeamRecruitmentModal from '../components/CreateTeamRecruitmentModal';
import CreatePlayerProfileModal from '../components/CreatePlayerProfileModal';
import RecruitmentCard from '../components/RecruitmentCard';
import PlayerProfileCard from '../components/PlayerProfileCard';
import ApplicantsReviewModal from '../components/ApplicantsReviewModal';
import NotificationDialog from '../components/NotificationDialog';
import MobileBottomNav from '../components/MobileBottomNav';
import config from '../config/config';

interface TeamRecruitment {
  _id: string;
  team: {
    _id: string;
    username: string;
    profile: {
      displayName: string;
      avatar: string;
    };
  };
  recruitmentType: 'roster' | 'staff';
  game: string;
  role?: string;
  staffRole?: string;
  requirements: {
    minimumRank?: string;
    dailyPlayingTime?: string;
    tournamentExperience?: string;
    communicationRequirements?: string;
    requiredDevice?: string;
    experienceLevel?: string;
    language?: string;
    additionalRequirements?: string;
    availability?: string;
    requiredSkills?: string;
    portfolioRequirements?: string;
  };
  benefits: {
    salary?: string;
    location?: string;
    benefitsAndPerks?: string;
    contactInformation?: string;
  };
  status: string;
  applicantCount: number;
  views: number;
  createdAt: string;
}

interface PlayerProfile {
  _id: string;
  player: {
    _id: string;
    username: string;
    profile: {
      displayName: string;
      avatar: string;
    };
  };
  profileType: 'looking-for-team' | 'staff-position';
  game: string;
  role?: string;
  staffRole?: string;
  playerInfo?: {
    playerName?: string;
    currentRank?: string;
    experienceLevel?: string;
    tournamentExperience?: string;
    achievements?: string;
    availability?: string;
    languages?: string;
    additionalInfo?: string;
  };
  professionalInfo?: {
    fullName?: string;
    experienceLevel?: string;
    availability?: string;
    preferredLocation?: string;
    skillsAndExpertise?: string;
    professionalAchievements?: string;
    portfolio?: string;
  };
  expectations: {
    expectedSalary?: string;
    preferredTeamSize?: string;
    teamType?: string;
    preferredLocation?: string;
    additionalInfo?: string;
    contactInformation?: string;
  };
  status: string;
  interestedTeamsCount: number;
  views: number;
  createdAt: string;
}

const Recruitment: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'team-recruitments' | 'staff-recruitments' | 'player-cards' | 'my-recruitments'>('team-recruitments');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [selectedRecruitment, setSelectedRecruitment] = useState<TeamRecruitment | null>(null);
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [notificationDialog, setNotificationDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning'
  });
  const [teamRecruitments, setTeamRecruitments] = useState<TeamRecruitment[]>([]);
  const [staffRecruitments, setStaffRecruitments] = useState<TeamRecruitment[]>([]);
  const [playerCards, setPlayerCards] = useState<PlayerProfile[]>([]);
  const [myRecruitments, setMyRecruitments] = useState<TeamRecruitment[]>([]);
  const [myProfiles, setMyProfiles] = useState<PlayerProfile[]>([]);
  const [myApplications, setMyApplications] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    game: '',
    type: '',
    location: ''
  });
  
  const [sorting, setSorting] = useState({
    teamRecruitments: { field: 'createdAt', order: 'desc' },
    staffRecruitments: { field: 'createdAt', order: 'desc' },
    playerCards: { field: 'createdAt', order: 'desc' },
    myRecruitments: { field: 'createdAt', order: 'desc' }
  });

  const games = [
    'BGMI', 'Valorant', 'Free Fire', 'Call of Duty Mobile', 
    'CS:GO', 'Fortnite', 'Apex Legends', 'League of Legends', 'Dota 2'
  ];

  const recruitmentTypes = ['roster', 'staff'];
  const profileTypes = ['looking-for-team', 'staff-position'];

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setNotificationDialog({
      isOpen: true,
      title,
      message,
      type
    });
  };

  const closeNotification = () => {
    setNotificationDialog(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    if (activeTab === 'team-recruitments') {
      fetchTeamRecruitments();
    } else if (activeTab === 'staff-recruitments') {
      fetchStaffRecruitments();
    } else if (activeTab === 'player-cards') {
      fetchPlayerCards();
    } else if (activeTab === 'my-recruitments') {
      fetchMyRecruitments();
    }
    
    // Fetch user's applications if user is a player
    if (user?.userType === 'player') {
      fetchMyApplications();
    }
  }, [activeTab, filters, sorting, user]);

  const fetchTeamRecruitments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.game) params.append('game', filters.game);
      if (filters.location) params.append('location', filters.location);
      if (searchTerm) params.append('search', searchTerm);
      params.append('recruitmentType', 'roster');
      params.append('sortBy', sorting.teamRecruitments.field);
      params.append('sortOrder', sorting.teamRecruitments.order);

      const response = await fetch(`${config.apiUrl}/api/recruitment/team-recruitments?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setTeamRecruitments(data.data.recruitments);
      }
    } catch (error) {
      console.error('Error fetching team recruitments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffRecruitments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.game) params.append('game', filters.game);
      if (filters.location) params.append('location', filters.location);
      if (searchTerm) params.append('search', searchTerm);
      params.append('recruitmentType', 'staff');
      params.append('sortBy', sorting.staffRecruitments.field);
      params.append('sortOrder', sorting.staffRecruitments.order);

      const response = await fetch(`${config.apiUrl}/api/recruitment/team-recruitments?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStaffRecruitments(data.data.recruitments);
      }
    } catch (error) {
      console.error('Error fetching staff recruitments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerCards = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.game) params.append('game', filters.game);
      if (filters.type) params.append('profileType', filters.type);
      if (filters.location) params.append('location', filters.location);
      if (searchTerm) params.append('search', searchTerm);
      params.append('sortBy', sorting.playerCards.field);
      params.append('sortOrder', sorting.playerCards.order);

      const response = await fetch(`${config.apiUrl}/api/recruitment/player-profiles?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPlayerCards(data.data.profiles);
      }
    } catch (error) {
      console.error('Error fetching player cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRecruitments = async () => {
    setLoading(true);
    try {
      // Fetch my team recruitments
      const teamResponse = await fetch(`${config.apiUrl}/api/recruitment/team-recruitments?my=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const teamData = await teamResponse.json();
      if (teamData.success) {
        setMyRecruitments(teamData.data.recruitments);
      }

      // Fetch my player profiles
      const profileResponse = await fetch(`${config.apiUrl}/api/recruitment/player-profiles?my=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const profileData = await profileResponse.json();
      if (profileData.success) {
        setMyProfiles(profileData.data.profiles);
      }
    } catch (error) {
      console.error('Error fetching my recruitments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/api/recruitment/applications/my`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        // Extract recruitment IDs from applications
        const appliedRecruitmentIds = data.data.applications.map((app: any) => app.recruitment._id);
        setMyApplications(appliedRecruitmentIds);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'team-recruitments') {
      fetchTeamRecruitments();
    } else if (activeTab === 'staff-recruitments') {
      fetchStaffRecruitments();
    } else if (activeTab === 'player-cards') {
      fetchPlayerCards();
    } else if (activeTab === 'my-recruitments') {
      fetchMyRecruitments();
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handler functions for card actions
  const handleEditRecruitment = (recruitment: any) => {
    // TODO: Open edit modal for recruitment
    console.log('Edit recruitment:', recruitment);
  };

  const handleDeleteRecruitment = async (recruitmentId: string) => {
    try {
      const response = await fetch(`${config.apiUrl}/api/recruitment/team-recruitments/${recruitmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        // Refresh the data
        fetchTeamRecruitments();
        fetchStaffRecruitments();
        fetchMyRecruitments();
      }
    } catch (error) {
      console.error('Error deleting recruitment:', error);
    }
  };

  const handleApplyToRecruitment = async (recruitment: any) => {
    try {
      const role = recruitment.recruitmentType === 'roster' ? recruitment.role : recruitment.staffRole;
      const message = `Hi! I have seen your ${recruitment.recruitmentType} recruitment post for ${recruitment.game} as ${role} and would like to apply for this position.`;
      
      const response = await fetch(`${config.apiUrl}/api/recruitment/team-recruitments/${recruitment._id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      if (data.success) {
        showNotification('Success!', 'Application submitted successfully!', 'success');
        // Refresh recruitments to update applicant count
        if (activeTab === 'team-recruitments') {
          fetchTeamRecruitments();
        } else if (activeTab === 'staff-recruitments') {
          fetchStaffRecruitments();
        }
        fetchMyRecruitments();
        // Refresh applications to update button state
        fetchMyApplications();
      } else {
        showNotification('Error', data.message || 'Failed to submit application', 'error');
      }
    } catch (error) {
      console.error('Error applying to recruitment:', error);
      showNotification('Error', 'Failed to submit application', 'error');
    }
  };

  const handleReviewApplicants = (recruitment: any) => {
    setSelectedRecruitment(recruitment);
    setShowApplicantsModal(true);
  };

  const handleCloseApplicantsModal = () => {
    setShowApplicantsModal(false);
    setSelectedRecruitment(null);
  };

  const handleEditProfile = (profile: any) => {
    // TODO: Open edit modal for profile
    console.log('Edit profile:', profile);
  };

  const handleDeleteProfile = async (profileId: string) => {
    try {
      const response = await fetch(`${config.apiUrl}/api/recruitment/player-profiles/${profileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        // Refresh the data
        fetchPlayerCards();
        fetchMyRecruitments();
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

  const handleContactProfile = (profile: any) => {
    // Navigate to messages page with the player's user ID
    navigate(`/messages?user=${profile.player._id}`);
  };

  const getRoleDisplay = (recruitment: TeamRecruitment) => {
    if (recruitment.recruitmentType === 'staff') {
      return recruitment.staffRole || 'Staff';
    }
    return recruitment.role || 'Player';
  };

  const getProfileRoleDisplay = (profile: PlayerProfile) => {
    if (profile.profileType === 'staff-position') {
      return profile.staffRole || 'Staff';
    }
    return profile.role || 'Player';
  };

  return (
    <div className="min-h-screen bg-black pt-4 lg:pt-16 pb-16 lg:pb-0">
      {/* Header */}
      <div className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {user?.userType === 'player' 
                  ? 'Find Teams & Opportunities' 
                  : 'Find Players & Staff'
                }
              </h1>
              <p className="text-sm sm:text-base text-gray-300">
                {user?.userType === 'player' 
                  ? 'Browse team recruitments and staff positions' 
                  : 'Browse player profiles and staff applications'
                }
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {user?.userType === 'team' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 sm:px-4 rounded-lg flex items-center space-x-1 sm:space-x-2 transition-colors text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Recruitment</span>
                </button>
              )}
              {user?.userType === 'player' && (
                <button
                  onClick={() => setShowPlayerModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 rounded-lg flex items-center space-x-1 sm:space-x-2 transition-colors text-sm sm:text-base"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Post Recruitment</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1 sm:py-0">
          <div className="flex overflow-x-auto space-x-3 sm:space-x-8">
            <button
              onClick={() => setActiveTab('team-recruitments')}
              className={`py-2 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                activeTab === 'team-recruitments'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Team Recruitments</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('staff-recruitments')}
              className={`py-2 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                activeTab === 'staff-recruitments'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Staff Recruitments</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('player-cards')}
              className={`py-2 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                activeTab === 'player-cards'
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Gamepad2 className="w-4 h-4" />
                <span>Player Cards</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('my-recruitments')}
              className={`py-2 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                activeTab === 'my-recruitments'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4" />
                <span>My Recruitments ({myRecruitments.length + myProfiles.length})</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 sm:p-6 border border-gray-700/50 shadow-2xl">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Search & Filters</h3>
              </div>
              {/* Mobile Toggle Button */}
              <button
                onClick={() => setShowSearchFilters(!showSearchFilters)}
                className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
            
            {/* Mobile Collapsible Content */}
            <div className={`${showSearchFilters ? 'block' : 'hidden'} md:block`}>
              <form onSubmit={handleSearch} className="space-y-4 sm:space-y-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by team name, player name, skills, role, or game..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={filters.game}
                    onChange={(e) => handleFilterChange('game', e.target.value)}
                    className="px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 min-w-[140px]"
                  >
                    <option value="">All Games</option>
                    {games.map(game => (
                      <option key={game} value={game}>{game}</option>
                    ))}
                  </select>
                  
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 min-w-[140px]"
                  >
                    <option value="">All Types</option>
                    {activeTab === 'team-recruitments' || activeTab === 'staff-recruitments'
                      ? recruitmentTypes.map(type => (
                          <option key={type} value={type}>
                            {type === 'roster' ? 'Roster' : 'Staff'}
                          </option>
                        ))
                      : profileTypes.map(type => (
                          <option key={type} value={type}>
                            {type === 'looking-for-team' ? 'Looking for Team' : 'Staff Position'}
                          </option>
                        ))
                    }
                  </select>
                  
                  <input
                    type="text"
                    placeholder="Location"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 min-w-[120px]"
                  />
                </div>
              </div>
              
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex flex-wrap gap-3 items-center">
                  <span className="text-gray-300 text-sm font-medium">Sort by:</span>
                  {activeTab === 'team-recruitments' && (
                    <>
                      <select
                        value={sorting.teamRecruitments.field}
                        onChange={(e) => setSorting(prev => ({
                          ...prev,
                          teamRecruitments: { ...prev.teamRecruitments, field: e.target.value }
                        }))}
                        className="px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                      >
                        <option value="createdAt">Date Posted</option>
                        <option value="game">Game</option>
                        <option value="role">Role</option>
                        <option value="applicantCount">Applicants</option>
                      </select>
                      <select
                        value={sorting.teamRecruitments.order}
                        onChange={(e) => setSorting(prev => ({
                          ...prev,
                          teamRecruitments: { ...prev.teamRecruitments, order: e.target.value }
                        }))}
                        className="px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                      >
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                      </select>
                    </>
                  )}
                  {activeTab === 'staff-recruitments' && (
                    <>
                      <select
                        value={sorting.staffRecruitments.field}
                        onChange={(e) => setSorting(prev => ({
                          ...prev,
                          staffRecruitments: { ...prev.staffRecruitments, field: e.target.value }
                        }))}
                        className="px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                      >
                        <option value="createdAt">Date Posted</option>
                        <option value="game">Game</option>
                        <option value="staffRole">Position</option>
                        <option value="applicantCount">Applicants</option>
                      </select>
                      <select
                        value={sorting.staffRecruitments.order}
                        onChange={(e) => setSorting(prev => ({
                          ...prev,
                          staffRecruitments: { ...prev.staffRecruitments, order: e.target.value }
                        }))}
                        className="px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                      >
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                      </select>
                    </>
                  )}
                  {activeTab === 'player-cards' && (
                    <>
                      <select
                        value={sorting.playerCards.field}
                        onChange={(e) => setSorting(prev => ({
                          ...prev,
                          playerCards: { ...prev.playerCards, field: e.target.value }
                        }))}
                        className="px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                      >
                        <option value="createdAt">Date Posted</option>
                        <option value="game">Game</option>
                        <option value="profileType">Profile Type</option>
                        <option value="interestedTeamsCount">Interest</option>
                      </select>
                      <select
                        value={sorting.playerCards.order}
                        onChange={(e) => setSorting(prev => ({
                          ...prev,
                          playerCards: { ...prev.playerCards, order: e.target.value }
                        }))}
                        className="px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                      >
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                      </select>
                    </>
                  )}
                </div>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 flex items-center space-x-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-black min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'team-recruitments' ? (
              <>
                {teamRecruitments.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="bg-gray-800/50 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                      <Shield className="w-12 h-12 text-purple-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">No team recruitments found</h3>
                    <p className="text-gray-400 text-lg mb-6">Try adjusting your search criteria or create a new recruitment post.</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
                    >
                      Create Team Recruitment
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {teamRecruitments.map((recruitment) => (
                      <RecruitmentCard
                        key={recruitment._id}
                        recruitment={recruitment}
                        roleDisplay={getRoleDisplay(recruitment)}
                        currentUserId={user?._id}
                        currentUserType={user?.userType}
                        appliedRecruitments={myApplications}
                        onEdit={handleEditRecruitment}
                        onDelete={handleDeleteRecruitment}
                        onApply={handleApplyToRecruitment}
                        onReviewApplicants={handleReviewApplicants}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : activeTab === 'staff-recruitments' ? (
              <>
                {staffRecruitments.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="bg-gray-800/50 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                      <Users className="w-12 h-12 text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">No staff recruitments found</h3>
                    <p className="text-gray-400 text-lg mb-6">Try adjusting your search criteria or create a new staff recruitment post.</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
                    >
                      Create Staff Recruitment
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {staffRecruitments.map((recruitment) => (
                      <RecruitmentCard
                        key={recruitment._id}
                        recruitment={recruitment}
                        roleDisplay={getRoleDisplay(recruitment)}
                        currentUserId={user?._id}
                        currentUserType={user?.userType}
                        appliedRecruitments={myApplications}
                        onEdit={handleEditRecruitment}
                        onDelete={handleDeleteRecruitment}
                        onApply={handleApplyToRecruitment}
                        onReviewApplicants={handleReviewApplicants}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : activeTab === 'player-cards' ? (
              <>
                {playerCards.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="bg-gray-800/50 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                      <Gamepad2 className="w-12 h-12 text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">No player cards found</h3>
                    <p className="text-gray-400 text-lg mb-6">Try adjusting your search criteria or create a new player profile.</p>
                    <button
                      onClick={() => setShowPlayerModal(true)}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
                    >
                      Create Player Profile
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {playerCards.map((profile) => (
                      <PlayerProfileCard
                        key={profile._id}
                        profile={profile}
                        roleDisplay={getProfileRoleDisplay(profile)}
                        currentUserId={user?._id}
                        onEdit={handleEditProfile}
                        onDelete={handleDeleteProfile}
                        onContact={handleContactProfile}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* My Team Recruitments */}
                {user?.userType === 'team' && myRecruitments.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-purple-400" />
                      My Team Recruitments ({myRecruitments.length})
                    </h3>
                    <div className="grid gap-6">
                      {myRecruitments.map(recruitment => (
                        <RecruitmentCard
                          key={recruitment._id}
                          recruitment={recruitment}
                          roleDisplay={getRoleDisplay(recruitment)}
                          currentUserId={user?._id}
                          currentUserType={user?.userType}
                          appliedRecruitments={myApplications}
                          onEdit={handleEditRecruitment}
                          onDelete={handleDeleteRecruitment}
                          onApply={handleApplyToRecruitment}
                          onReviewApplicants={handleReviewApplicants}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* My Player Profiles */}
                {user?.userType === 'player' && myProfiles.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-blue-400" />
                      My Player Profiles ({myProfiles.length})
                    </h3>
                    <div className="grid gap-6">
                      {myProfiles.map(profile => (
                        <PlayerProfileCard
                          key={profile._id}
                          profile={profile}
                          roleDisplay={getProfileRoleDisplay(profile)}
                          currentUserId={user?._id}
                          onEdit={handleEditProfile}
                          onDelete={handleDeleteProfile}
                          onContact={handleContactProfile}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {((user?.userType === 'team' && myRecruitments.length === 0) || 
                  (user?.userType === 'player' && myProfiles.length === 0)) && (
                  <div className="text-center py-12">
                    <Briefcase className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">No recruitments yet</h3>
                    <p className="text-gray-500 mb-4">Create your first recruitment post to get started</p>
                    {user?.userType === 'team' ? (
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        Create Recruitment
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowPlayerModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        Post Recruitment
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateTeamRecruitmentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchTeamRecruitments();
            fetchStaffRecruitments();
            fetchMyRecruitments();
          }}
        />
      )}

      {showPlayerModal && (
        <CreatePlayerProfileModal
          onClose={() => setShowPlayerModal(false)}
          onSuccess={() => {
            setShowPlayerModal(false);
            fetchPlayerCards();
            fetchMyRecruitments();
          }}
        />
      )}

      {showApplicantsModal && selectedRecruitment && (
        <ApplicantsReviewModal
          isOpen={showApplicantsModal}
          onClose={handleCloseApplicantsModal}
          recruitment={selectedRecruitment}
        />
      )}

      {/* Notification Dialog */}
      <NotificationDialog
        isOpen={notificationDialog.isOpen}
        onClose={closeNotification}
        title={notificationDialog.title}
        message={notificationDialog.message}
        type={notificationDialog.type}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default Recruitment;
