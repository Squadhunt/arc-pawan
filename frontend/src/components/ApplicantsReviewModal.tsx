import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Calendar, CheckCircle, XCircle, Clock, MessageCircle, FileText, ExternalLink, Users } from 'lucide-react';
import NotificationDialog from './NotificationDialog';
import config from '../config/config';

interface Applicant {
  _id: string;
  applicant: {
    _id: string;
    username: string;
    profile: {
      displayName: string;
      avatar: string;
      bio?: string;
      location?: string;
      email?: string;
      phone?: string;
    };
  };
  message: string;
  resume?: string;
  portfolio?: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'accepted' | 'withdrawn';
  teamResponse?: {
    message?: string;
    respondedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

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
  applicantCount: number;
}

interface ApplicantsReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  recruitment: TeamRecruitment | null;
}

const ApplicantsReviewModal: React.FC<ApplicantsReviewModalProps> = ({
  isOpen,
  onClose,
  recruitment
}) => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [responseMessage, setResponseMessage] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [notificationDialog, setNotificationDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning'
  });

  useEffect(() => {
    if (isOpen && recruitment) {
      fetchApplicants();
    }
  }, [isOpen, recruitment]);

  const fetchApplicants = async () => {
    if (!recruitment) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${config.apiUrl}/api/recruitment/team-applications?recruitmentId=${recruitment._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setApplicants(data.data.applications);
      }
    } catch (error) {
      console.error('Error fetching applicants:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    setUpdatingStatus(true);
    try {
      const response = await fetch(`${config.apiUrl}/api/recruitment/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status,
          message: responseMessage
        })
      });

      const data = await response.json();
      if (data.success) {
        setApplicants(prev => prev.map(app => 
          app._id === applicationId 
            ? { ...app, status: status as Applicant['status'], teamResponse: data.data.teamResponse }
            : app
        ));
        setResponseMessage('');
        setSelectedApplicant(null);
        showNotification('Success!', 'Application status updated successfully!', 'success');
      } else {
        showNotification('Error', data.message || 'Failed to update status', 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('Error', 'Failed to update status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'reviewed': return 'bg-blue-500';
      case 'shortlisted': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'accepted': return 'bg-green-600';
      case 'withdrawn': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'reviewed': return 'Reviewed';
      case 'shortlisted': return 'Shortlisted';
      case 'rejected': return 'Rejected';
      case 'accepted': return 'Accepted';
      case 'withdrawn': return 'Withdrawn';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredApplicants = applicants.filter(applicant => 
    statusFilter === 'all' || applicant.status === statusFilter
  );

  if (!isOpen || !recruitment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Review Applicants - {recruitment.team.profile.displayName}
            </h2>
            <p className="text-gray-400 text-sm">
              {recruitment.game} • {recruitment.recruitmentType === 'roster' ? recruitment.role : recruitment.staffRole}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">Filter by status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
            >
              <option value="all">All ({applicants.length})</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
              <option value="accepted">Accepted</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-96">
          {/* Applicants List */}
          <div className="w-1/2 border-r border-gray-700 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-400">Loading applicants...</div>
              </div>
            ) : filteredApplicants.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-400 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p>No applicants found</p>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {filteredApplicants.map((applicant) => (
                  <div
                    key={applicant._id}
                    onClick={() => setSelectedApplicant(applicant)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedApplicant?._id === applicant._id
                        ? 'border-purple-500 bg-purple-900 bg-opacity-20'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-700 bg-opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">
                            {applicant.applicant.profile.displayName}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            @{applicant.applicant.username}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(applicant.status)}`}>
                        {getStatusText(applicant.status)}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm line-clamp-2">
                      {applicant.message}
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                      Applied {formatDate(applicant.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Applicant Details */}
          <div className="w-1/2 p-6 overflow-y-auto">
            {selectedApplicant ? (
              <div className="space-y-6">
                {/* Applicant Info */}
                <div>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {selectedApplicant.applicant.profile.displayName}
                      </h3>
                      <p className="text-gray-400">@{selectedApplicant.applicant.username}</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusColor(selectedApplicant.status)}`}>
                        {getStatusText(selectedApplicant.status)}
                      </span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {selectedApplicant.applicant.profile.email && (
                      <div className="flex items-center space-x-2 text-gray-300">
                        <Mail className="w-4 h-4" />
                        <span>{selectedApplicant.applicant.profile.email}</span>
                      </div>
                    )}
                    {selectedApplicant.applicant.profile.phone && (
                      <div className="flex items-center space-x-2 text-gray-300">
                        <Phone className="w-4 h-4" />
                        <span>{selectedApplicant.applicant.profile.phone}</span>
                      </div>
                    )}
                    {selectedApplicant.applicant.profile.location && (
                      <div className="flex items-center space-x-2 text-gray-300">
                        <MapPin className="w-4 h-4" />
                        <span>{selectedApplicant.applicant.profile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Calendar className="w-4 h-4" />
                      <span>Applied {formatDate(selectedApplicant.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {selectedApplicant.applicant.profile.bio && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Bio</h4>
                    <p className="text-gray-400 text-sm">{selectedApplicant.applicant.profile.bio}</p>
                  </div>
                )}

                {/* Application Message */}
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Application Message</h4>
                  <p className="text-gray-400 text-sm bg-gray-700 p-3 rounded-lg">
                    {selectedApplicant.message}
                  </p>
                </div>

                {/* Resume & Portfolio */}
                {(selectedApplicant.resume || selectedApplicant.portfolio) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Documents</h4>
                    <div className="space-y-2">
                      {selectedApplicant.resume && (
                        <a
                          href={selectedApplicant.resume}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 text-sm"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Resume</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {selectedApplicant.portfolio && (
                        <a
                          href={selectedApplicant.portfolio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 text-sm"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Portfolio</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Team Response */}
                {selectedApplicant.teamResponse && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Your Response</h4>
                    <p className="text-gray-400 text-sm bg-gray-700 p-3 rounded-lg">
                      {selectedApplicant.teamResponse.message}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Responded {formatDate(selectedApplicant.teamResponse.respondedAt || '')}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Response Message (Optional)
                    </label>
                    <textarea
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      placeholder="Add a message for the applicant..."
                      className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-3">
                    {selectedApplicant.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateApplicationStatus(selectedApplicant._id, 'reviewed')}
                          disabled={updatingStatus}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                        >
                          <Clock className="w-4 h-4" />
                          <span>Mark as Reviewed</span>
                        </button>
                        <button
                          onClick={() => updateApplicationStatus(selectedApplicant._id, 'shortlisted')}
                          disabled={updatingStatus}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Shortlist</span>
                        </button>
                        <button
                          onClick={() => updateApplicationStatus(selectedApplicant._id, 'rejected')}
                          disabled={updatingStatus}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                    {selectedApplicant.status === 'reviewed' && (
                      <>
                        <button
                          onClick={() => updateApplicationStatus(selectedApplicant._id, 'shortlisted')}
                          disabled={updatingStatus}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Shortlist</span>
                        </button>
                        <button
                          onClick={() => updateApplicationStatus(selectedApplicant._id, 'rejected')}
                          disabled={updatingStatus}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                    {selectedApplicant.status === 'shortlisted' && (
                      <button
                        onClick={() => updateApplicationStatus(selectedApplicant._id, 'accepted')}
                        disabled={updatingStatus}
                        className="px-4 py-2 bg-green-700 hover:bg-green-800 disabled:bg-green-900 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Accept</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-400 text-center">
                  <User className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p>Select an applicant to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Dialog */}
      <NotificationDialog
        isOpen={notificationDialog.isOpen}
        onClose={closeNotification}
        title={notificationDialog.title}
        message={notificationDialog.message}
        type={notificationDialog.type}
      />
    </div>
  );
};

export default ApplicantsReviewModal;
