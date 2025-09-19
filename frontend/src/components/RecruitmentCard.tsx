import React, { useState } from 'react';
import { MapPin, Clock, Users, DollarSign, Shield, Briefcase, MessageCircle, CheckCircle, Edit, Trash2 } from 'lucide-react';
import ConfirmationDialog from './ConfirmationDialog';

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
    dailyPlayingTime?: string;
    tournamentExperience?: string;
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

interface RecruitmentCardProps {
  recruitment: TeamRecruitment;
  roleDisplay: string;
  currentUserId?: string;
  currentUserType?: string;
  appliedRecruitments?: string[];
  onEdit?: (recruitment: TeamRecruitment) => void;
  onDelete?: (recruitmentId: string) => void;
  onApply?: (recruitment: TeamRecruitment) => void;
  onReviewApplicants?: (recruitment: TeamRecruitment) => void;
}

const RecruitmentCard: React.FC<RecruitmentCardProps> = ({ 
  recruitment, 
  roleDisplay, 
  currentUserId, 
  currentUserType,
  appliedRecruitments = [],
  onEdit, 
  onDelete, 
  onApply,
  onReviewApplicants
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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
      case 'paused': return 'bg-yellow-500';
      case 'closed': return 'bg-red-500';
      case 'filled': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'roster' ? 'bg-purple-500' : 'bg-blue-500';
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(recruitment);
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this recruitment post?')) {
      onDelete(recruitment._id);
    }
  };

  const handleApply = () => {
    if (onApply) {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmApply = () => {
    if (onApply) {
      onApply(recruitment);
      setShowConfirmDialog(false);
    }
  };

  const handleReviewApplicants = () => {
    if (onReviewApplicants) {
      onReviewApplicants(recruitment);
    }
  };

  const isOwnRecruitment = currentUserId && recruitment.team._id === currentUserId;
  const hasApplied = appliedRecruitments.includes(recruitment._id);

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-8 shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
        <div className="flex items-center space-x-3 mb-3 sm:mb-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center shadow-lg border border-gray-600/30">
            <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-white truncate">{recruitment.team.profile.displayName}</h3>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
              <span className={`px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${getTypeColor(recruitment.recruitmentType)}`}>
                {recruitment.recruitmentType === 'roster' ? 'Team Recruiting' : 'Staff Recruiting'}
              </span>
              <span className="px-3 py-1.5 bg-gray-600/80 rounded-full text-xs text-gray-300 shadow-sm border border-gray-500/30">
                {recruitment.game}
              </span>
              <span className="px-3 py-1.5 bg-red-500/90 rounded-full text-xs text-white shadow-sm border border-red-400/30">
                {roleDisplay}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className="flex items-center space-x-2 text-gray-300">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm truncate">{recruitment.benefits.location || 'Not specified'}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-300">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{formatTimeAgo(recruitment.createdAt)}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-300">
          <DollarSign className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm text-green-400 truncate">{recruitment.benefits.salary || 'Not specified'}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-300">
          <Users className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{recruitment.applicantCount} applicants</span>
        </div>
      </div>

      {/* Requirements Preview */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Requirements:</h4>
        <div className="text-sm text-gray-400">
          <div className="flex flex-wrap gap-2">
            {recruitment.requirements.experienceLevel && (
              <span className="inline-block bg-gray-700/80 px-3 py-1.5 rounded-lg text-xs shadow-sm border border-gray-600/30">
                {recruitment.requirements.experienceLevel} level
              </span>
            )}
            {recruitment.requirements.tournamentExperience && (
              <span className="inline-block bg-gray-700/80 px-3 py-1.5 rounded-lg text-xs shadow-sm border border-gray-600/30">
                {recruitment.requirements.tournamentExperience}
              </span>
            )}
          </div>
        </div>
        {recruitment.requirements.additionalRequirements && (
          <p className="text-sm text-gray-400 mt-2 line-clamp-2">
            {recruitment.requirements.additionalRequirements}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center space-x-1 self-start transition-colors duration-200"
        >
          <span>{showDetails ? 'Hide Details' : 'View Details'}</span>
          <span className={`transform transition-transform duration-200 ${showDetails ? 'rotate-180' : 'rotate-0'}`}>
            ▼
          </span>
        </button>
        
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {isOwnRecruitment ? (
            <>
              <button
                onClick={handleEdit}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 sm:px-4 text-xs sm:text-sm rounded-lg flex items-center space-x-1 transition-colors duration-200"
              >
                <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={handleReviewApplicants}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 text-xs sm:text-sm rounded-lg flex items-center space-x-1 transition-colors duration-200"
              >
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Review Applicants ({recruitment.applicantCount})</span>
                <span className="sm:hidden">Review ({recruitment.applicantCount})</span>
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 sm:px-4 text-xs sm:text-sm rounded-lg flex items-center space-x-1 transition-colors duration-200"
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Delete</span>
              </button>
            </>
          ) : (
            currentUserType === 'player' && (
              hasApplied ? (
                <button
                  disabled
                  className="bg-gray-600 text-gray-300 px-3 py-2 sm:px-4 text-xs sm:text-sm rounded-lg flex items-center space-x-1 cursor-not-allowed opacity-50"
                >
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Applied</span>
                </button>
              ) : (
                <button
                  onClick={handleApply}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 sm:px-4 text-xs sm:text-sm rounded-lg flex items-center space-x-1 transition-colors duration-200"
                >
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Apply</span>
                </button>
              )
            )
          )}
        </div>
      </div>

      {/* Detailed View */}
      {showDetails && (
        <div className="mt-6 pt-6 border-t border-gray-700 space-y-4">
          {/* Full Requirements */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Full Requirements:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
              {recruitment.requirements.dailyPlayingTime && (
                <div>
                  <span className="text-gray-400">Daily Playing Time:</span>
                  <span className="text-white ml-2">{recruitment.requirements.dailyPlayingTime}</span>
                </div>
              )}
              {recruitment.requirements.tournamentExperience && (
                <div>
                  <span className="text-gray-400">Tournament Experience:</span>
                  <span className="text-white ml-2">{recruitment.requirements.tournamentExperience}</span>
                </div>
              )}
              {recruitment.requirements.requiredDevice && (
                <div>
                  <span className="text-gray-400">Required Device:</span>
                  <span className="text-white ml-2">{recruitment.requirements.requiredDevice}</span>
                </div>
              )}
              {recruitment.requirements.language && (
                <div>
                  <span className="text-gray-400">Language:</span>
                  <span className="text-white ml-2">{recruitment.requirements.language}</span>
                </div>
              )}
              {recruitment.requirements.availability && (
                <div>
                  <span className="text-gray-400">Availability:</span>
                  <span className="text-white ml-2">{recruitment.requirements.availability}</span>
                </div>
              )}
            </div>
          </div>

          {/* Benefits */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">What We Provide:</h4>
            <div className="space-y-2 text-sm">
              {recruitment.benefits.salary && (
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-gray-400">Salary:</span>
                  <span className="text-green-400">{recruitment.benefits.salary}</span>
                </div>
              )}
              {recruitment.benefits.location && (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Location:</span>
                  <span className="text-white">{recruitment.benefits.location}</span>
                </div>
              )}
              {recruitment.benefits.benefitsAndPerks && (
                <div>
                  <span className="text-gray-400">Benefits & Perks:</span>
                  <p className="text-white mt-1">{recruitment.benefits.benefitsAndPerks}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          {recruitment.benefits.contactInformation && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Contact Information:</h4>
              <p className="text-sm text-gray-400">{recruitment.benefits.contactInformation}</p>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmApply}
        title="Apply to Recruitment"
        message={`Do you want to apply to this ${recruitment.recruitmentType} recruitment for ${recruitment.game} as ${recruitment.recruitmentType === 'roster' ? recruitment.role : recruitment.staffRole}?`}
        confirmText="Apply"
        cancelText="Cancel"
        type="info"
      />
    </div>
  );
};

export default RecruitmentCard;
