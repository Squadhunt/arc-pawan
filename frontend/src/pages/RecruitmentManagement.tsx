import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Briefcase, 
  User, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users,
  MessageCircle,
  Filter,
  Search
} from 'lucide-react';

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
  requirements: any;
  benefits: any;
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
  playerInfo?: any;
  professionalInfo?: any;
  expectations: any;
  status: string;
  interestedTeamsCount: number;
  views: number;
  createdAt: string;
}

interface Application {
  _id: string;
  applicant: {
    _id: string;
    username: string;
    profile: {
      displayName: string;
      avatar: string;
    };
  };
  recruitment: {
    _id: string;
    game: string;
    role?: string;
    staffRole?: string;
    recruitmentType: string;
    team: {
      _id: string;
      username: string;
      profile: {
        displayName: string;
        avatar: string;
      };
    };
  };
  status: string;
  message?: string;
  appliedAt: string;
  teamResponse?: {
    message?: string;
    respondedAt?: string;
  };
}

const RecruitmentManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'my-recruitments' | 'my-profiles' | 'applications'>('my-recruitments');
  const [myRecruitments, setMyRecruitments] = useState<TeamRecruitment[]>([]);
  const [myProfiles, setMyProfiles] = useState<PlayerProfile[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (activeTab === 'my-recruitments') {
      fetchMyRecruitments();
    } else if (activeTab === 'my-profiles') {
      fetchMyProfiles();
    } else {
      fetchApplications();
    }
  }, [activeTab, statusFilter]);

  const fetchMyRecruitments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/recruitment/team-recruitments?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        // Filter to only show current user's recruitments
        const userRecruitments = data.data.recruitments.filter(
          (rec: TeamRecruitment) => rec.team._id === user?._id
        );
        setMyRecruitments(userRecruitments);
      }
    } catch (error) {
      console.error('Error fetching recruitments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProfiles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/recruitment/player-profiles?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        // Filter to only show current user's profiles
        const userProfiles = data.data.profiles.filter(
          (profile: PlayerProfile) => profile.player._id === user?._id
        );
        setMyProfiles(userProfiles);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/recruitment/applications/my?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setApplications(data.data.applications);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecruitment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this recruitment post?')) return;

    try {
      const response = await fetch(`/api/recruitment/team-recruitments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setMyRecruitments(prev => prev.filter(rec => rec._id !== id));
      }
    } catch (error) {
      console.error('Error deleting recruitment:', error);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this profile?')) return;

    try {
      const response = await fetch(`/api/recruitment/player-profiles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setMyProfiles(prev => prev.filter(profile => profile._id !== id));
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'reviewed': return 'bg-blue-500';
      case 'shortlisted': return 'bg-purple-500';
      case 'accepted': return 'bg-green-600';
      case 'rejected': return 'bg-red-500';
      case 'paused': return 'bg-gray-500';
      case 'closed': return 'bg-red-600';
      case 'filled': return 'bg-blue-600';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'pending': return 'Pending';
      case 'reviewed': return 'Reviewed';
      case 'shortlisted': return 'Shortlisted';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      case 'paused': return 'Paused';
      case 'closed': return 'Closed';
      case 'filled': return 'Filled';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-black pt-16">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Recruitment Management</h1>
              <p className="text-gray-300">Manage your recruitments, profiles, and applications</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {user?.userType === 'team' && (
              <button
                onClick={() => setActiveTab('my-recruitments')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'my-recruitments'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4" />
                  <span>My Recruitments</span>
                </div>
              </button>
            )}
            {user?.userType === 'player' && (
              <button
                onClick={() => setActiveTab('my-profiles')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'my-profiles'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>My Profiles</span>
                </div>
              </button>
            )}
            <button
              onClick={() => setActiveTab('applications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'applications'
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span>My Applications</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* My Recruitments */}
            {activeTab === 'my-recruitments' && (
              <>
                {myRecruitments.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">No recruitments found</h3>
                    <p className="text-gray-500">Create your first recruitment post to get started.</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {myRecruitments.map((recruitment) => (
                      <div key={recruitment._id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                              <Briefcase className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">{recruitment.game}</h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(recruitment.status)}`}>
                                  {getStatusText(recruitment.status)}
                                </span>
                                <span className="px-2 py-1 bg-gray-600 rounded-full text-xs text-gray-300">
                                  {recruitment.recruitmentType === 'roster' ? recruitment.role : recruitment.staffRole}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-400 text-sm">{recruitment.applicantCount} applicants</span>
                            <span className="text-gray-400 text-sm">{recruitment.views} views</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>Created {formatTimeAgo(recruitment.createdAt)}</span>
                            <span>Salary: {recruitment.benefits.salary || 'Not specified'}</span>
                            <span>Location: {recruitment.benefits.location || 'Not specified'}</span>
                          </div>
                          <div className="flex space-x-2">
                            <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteRecruitment(recruitment._id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* My Profiles */}
            {activeTab === 'my-profiles' && (
              <>
                {myProfiles.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">No profiles found</h3>
                    <p className="text-gray-500">Create your first player profile to get started.</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {myProfiles.map((profile) => (
                      <div key={profile._id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                              <User className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">{profile.game}</h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(profile.status)}`}>
                                  {getStatusText(profile.status)}
                                </span>
                                <span className="px-2 py-1 bg-gray-600 rounded-full text-xs text-gray-300">
                                  {profile.profileType === 'looking-for-team' ? profile.role : profile.staffRole}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-400 text-sm">{profile.interestedTeamsCount} interested</span>
                            <span className="text-gray-400 text-sm">{profile.views} views</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>Created {formatTimeAgo(profile.createdAt)}</span>
                            <span>Salary: {profile.expectations.expectedSalary || 'Not specified'}</span>
                            <span>Location: {profile.expectations.preferredLocation || 'Not specified'}</span>
                          </div>
                          <div className="flex space-x-2">
                            <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteProfile(profile._id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* My Applications */}
            {activeTab === 'applications' && (
              <>
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">No applications found</h3>
                    <p className="text-gray-500">Apply to recruitment posts to see your applications here.</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {applications.map((application) => (
                      <div key={application._id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                              <Briefcase className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">
                                {application.recruitment.team.profile.displayName}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                                  {getStatusText(application.status)}
                                </span>
                                <span className="px-2 py-1 bg-gray-600 rounded-full text-xs text-gray-300">
                                  {application.recruitment.game}
                                </span>
                                <span className="px-2 py-1 bg-red-500 rounded-full text-xs text-white">
                                  {application.recruitment.recruitmentType === 'roster' 
                                    ? application.recruitment.role 
                                    : application.recruitment.staffRole
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-400">
                            Applied {formatTimeAgo(application.appliedAt)}
                          </div>
                        </div>

                        {application.message && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-300">{application.message}</p>
                          </div>
                        )}

                        {application.teamResponse && (
                          <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-300">
                              <strong>Team Response:</strong> {application.teamResponse.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTimeAgo(application.teamResponse.respondedAt || '')}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-400">
                            {application.recruitment.recruitmentType === 'roster' ? 'Player' : 'Staff'} Application
                          </div>
                          <div className="flex space-x-2">
                            {application.status === 'pending' && (
                              <button className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm">
                                <Clock className="w-4 h-4" />
                              </button>
                            )}
                            {application.status === 'accepted' && (
                              <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {application.status === 'rejected' && (
                              <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm">
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruitmentManagement;
