import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Users, User, Briefcase, MessageCircle, Heart, Edit, Trash2 } from 'lucide-react';
import AnimatedButton from './AnimatedButton';
import AnimatedCard from './AnimatedCard';

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

interface PlayerProfileCardProps {
  profile: PlayerProfile;
  roleDisplay: string;
  currentUserId?: string;
  onEdit?: (profile: PlayerProfile) => void;
  onDelete?: (profileId: string) => void;
  onContact?: (profile: PlayerProfile) => void;
}

const PlayerProfileCard: React.FC<PlayerProfileCardProps> = ({ 
  profile, 
  roleDisplay, 
  currentUserId, 
  onEdit, 
  onDelete, 
  onContact 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showingInterest, setShowingInterest] = useState(false);

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

  const handleShowInterest = async () => {
    setShowingInterest(true);
    try {
      const response = await fetch(`/api/recruitment/player-profiles/${profile._id}/interest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: `We're interested in your ${profile.profileType === 'looking-for-team' ? 'player' : 'staff'} profile for ${profile.game} as ${roleDisplay}.`
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Interest shown successfully!');
      } else {
        alert(data.message || 'Failed to show interest');
      }
    } catch (error) {
      console.error('Error showing interest:', error);
      alert('Failed to show interest');
    } finally {
      setShowingInterest(false);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(profile);
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this profile?')) {
      onDelete(profile._id);
    }
  };

  const handleContact = () => {
    if (onContact) {
      onContact(profile);
    }
  };

  const isOwnProfile = currentUserId && profile.player._id === currentUserId;

  const getTypeColor = (type: string) => {
    return type === 'looking-for-team' ? 'bg-blue-500' : 'bg-purple-500';
  };

  const getProfileInfo = () => {
    if (profile.profileType === 'looking-for-team') {
      return profile.playerInfo;
    }
    return profile.professionalInfo;
  };

  const profileInfo = getProfileInfo() as any;

  return (
    <AnimatedCard 
      className="p-8" 
      hoverable={true}
      variant="elevated"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Link 
            to={`/profile/${profile.player._id}`}
            className="w-14 h-14 rounded-xl overflow-hidden shadow-lg border border-gray-600/30 hover:border-blue-400/50 transition-all duration-300 hover:scale-105"
          >
            {profile.player.profile.avatar ? (
              <img 
                src={profile.player.profile.avatar} 
                alt={profile.player.profile.displayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center ${profile.player.profile.avatar ? 'hidden' : ''}`}>
              <User className="w-7 h-7 text-white" />
            </div>
          </Link>
          <div>
            <Link 
              to={`/profile/${profile.player._id}`}
              className="text-lg font-semibold text-white hover:text-blue-400 transition-colors duration-300"
            >
              {profile.player.profile.displayName}
            </Link>
            <div className="flex items-center space-x-2 mt-2">
              <span className={`px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${getTypeColor(profile.profileType)}`}>
                {profile.profileType === 'looking-for-team' ? 'Looking for Team' : 'Staff Position'}
              </span>
              <span className="px-3 py-1.5 bg-gray-600/80 rounded-full text-xs text-gray-300 shadow-sm border border-gray-500/30">
                {profile.game}
              </span>
              <span className="px-3 py-1.5 bg-red-500/90 rounded-full text-xs text-white shadow-sm border border-red-400/30">
                {roleDisplay}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        <div className="flex items-center space-x-2 text-gray-300">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{profile.expectations.preferredLocation || 'Not specified'}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-300">
          <Clock className="w-4 h-4" />
          <span className="text-sm">{formatTimeAgo(profile.createdAt)}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-300">
          <span className="text-green-400 font-bold text-lg">₹</span>
          <span className="text-sm text-green-400">{profile.expectations.expectedSalary || 'Not specified'}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-300">
          <Users className="w-4 h-4" />
          <span className="text-sm">{profile.interestedTeamsCount} interested</span>
        </div>
      </div>

      {/* Profile Preview */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Profile Highlights:</h4>
        <div className="text-sm text-gray-400">
          {profileInfo?.playerName && (
            <span className="inline-block bg-gray-700/80 px-3 py-1.5 rounded-lg mr-2 mb-2 shadow-sm border border-gray-600/30">
              IGN: {profileInfo.playerName}
            </span>
          )}
          {profileInfo?.currentRank && (
            <span className="inline-block bg-gray-700/80 px-3 py-1.5 rounded-lg mr-2 mb-2 shadow-sm border border-gray-600/30">
              {profileInfo.currentRank} rank
            </span>
          )}
          {profileInfo?.experienceLevel && (
            <span className="inline-block bg-gray-700/80 px-3 py-1.5 rounded-lg mr-2 mb-2 shadow-sm border border-gray-600/30">
              {profile.profileType === 'looking-for-team' ? 'Game: ' : 'Professional: '}{profileInfo.experienceLevel}
            </span>
          )}
          {profileInfo?.tournamentExperience && (
            <span className="inline-block bg-gray-700/80 px-3 py-1.5 rounded-lg mr-2 mb-2 shadow-sm border border-gray-600/30">
              Competitive: {profileInfo.tournamentExperience}
            </span>
          )}
          {profileInfo?.availability && (
            <span className="inline-block bg-gray-700/80 px-3 py-1.5 rounded-lg mr-2 mb-2 shadow-sm border border-gray-600/30">
              {profileInfo.availability}
            </span>
          )}
          {profileInfo?.languages && (
            <span className="inline-block bg-gray-700/80 px-3 py-1.5 rounded-lg mr-2 mb-2 shadow-sm border border-gray-600/30">
              {profileInfo.languages}
            </span>
          )}
        </div>
        {profileInfo?.achievements && (
          <p className="text-sm text-gray-400 mt-2 line-clamp-2">
            {profileInfo.achievements}
          </p>
        )}
        {profileInfo?.skillsAndExpertise && (
          <p className="text-sm text-gray-400 mt-2 line-clamp-2">
            {profileInfo.skillsAndExpertise}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <motion.button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center space-x-1"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.1 }}
        >
          <span>{showDetails ? 'Hide Details' : 'View Details'}</span>
          <motion.span
            animate={{ rotate: showDetails ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▼
          </motion.span>
        </motion.button>
        
        <div className="flex space-x-3">
          {isOwnProfile ? (
            <>
              <AnimatedButton
                onClick={handleEdit}
                variant="success"
                size="sm"
                icon={<Edit className="w-4 h-4" />}
              >
                Edit
              </AnimatedButton>
              <AnimatedButton
                onClick={handleDelete}
                variant="danger"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
              >
                Delete
              </AnimatedButton>
            </>
          ) : (
            <AnimatedButton
              onClick={handleContact}
              variant="primary"
              size="sm"
              icon={<MessageCircle className="w-4 h-4" />}
            >
              Contact Player
            </AnimatedButton>
          )}
        </div>
      </div>

      {/* Detailed View */}
      {showDetails && (
        <motion.div 
          className="mt-6 pt-6 border-t border-gray-700 space-y-4"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Full Profile Info */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Full Profile:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {profileInfo?.playerName && (
                <div>
                  <span className="text-gray-400">Player Name:</span>
                  <span className="text-white ml-2">{profileInfo.playerName}</span>
                </div>
              )}
              {profileInfo?.fullName && (
                <div>
                  <span className="text-gray-400">Full Name:</span>
                  <span className="text-white ml-2">{profileInfo.fullName}</span>
                </div>
              )}
              {profileInfo?.currentRank && (
                <div>
                  <span className="text-gray-400">Current Rank:</span>
                  <span className="text-white ml-2">{profileInfo.currentRank}</span>
                </div>
              )}
              {profileInfo?.experienceLevel && (
                <div>
                  <span className="text-gray-400">{profile.profileType === 'looking-for-team' ? 'Game Experience:' : 'Professional Experience:'}</span>
                  <span className="text-white ml-2">{profileInfo.experienceLevel}</span>
                </div>
              )}
              {profileInfo?.tournamentExperience && (
                <div>
                  <span className="text-gray-400">Competitive Experience:</span>
                  <span className="text-white ml-2">{profileInfo.tournamentExperience}</span>
                </div>
              )}
              {profileInfo?.availability && (
                <div>
                  <span className="text-gray-400">Availability:</span>
                  <span className="text-white ml-2">{profileInfo.availability}</span>
                </div>
              )}
              {profileInfo?.languages && (
                <div>
                  <span className="text-gray-400">Languages:</span>
                  <span className="text-white ml-2">{profileInfo.languages}</span>
                </div>
              )}
              {profileInfo?.preferredLocation && (
                <div>
                  <span className="text-gray-400">Preferred Location:</span>
                  <span className="text-white ml-2">{profileInfo.preferredLocation}</span>
                </div>
              )}
            </div>
          </div>

          {/* Achievements/Skills */}
          {(profileInfo?.achievements || profileInfo?.skillsAndExpertise) && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                {profile.profileType === 'looking-for-team' ? 'Achievements & Highlights:' : 'Skills & Expertise:'}
              </h4>
              <p className="text-sm text-white">
                {profileInfo?.achievements || profileInfo?.skillsAndExpertise}
              </p>
            </div>
          )}

          {/* Professional Achievements */}
          {profileInfo?.professionalAchievements && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Professional Achievements:</h4>
              <p className="text-sm text-white">{profileInfo.professionalAchievements}</p>
            </div>
          )}

          {/* Portfolio */}
          {profileInfo?.portfolio && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Portfolio/Previous Work:</h4>
              <p className="text-sm text-white">{profileInfo.portfolio}</p>
            </div>
          )}

          {/* Expectations */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Expectations:</h4>
            <div className="space-y-2 text-sm">
              {profile.expectations.expectedSalary && (
                <div className="flex items-center space-x-2">
                  <span className="text-green-400 font-bold text-lg">₹</span>
                  <span className="text-gray-400">Expected Salary:</span>
                  <span className="text-green-400">{profile.expectations.expectedSalary}</span>
                </div>
              )}
              {profile.expectations.preferredLocation && (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Preferred Location:</span>
                  <span className="text-white">{profile.expectations.preferredLocation}</span>
                </div>
              )}
              {profile.expectations.preferredTeamSize && (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Preferred Team Size:</span>
                  <span className="text-white">{profile.expectations.preferredTeamSize}</span>
                </div>
              )}
              {profile.expectations.teamType && (
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Team Type:</span>
                  <span className="text-white">{profile.expectations.teamType}</span>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          {profile.expectations.additionalInfo && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Additional Information:</h4>
              <p className="text-sm text-gray-400">{profile.expectations.additionalInfo}</p>
            </div>
          )}

          {/* Contact Information */}
          {profile.expectations.contactInformation && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Contact Information:</h4>
              <p className="text-sm text-gray-400">{profile.expectations.contactInformation}</p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatedCard>
  );
};

export default PlayerProfileCard;
