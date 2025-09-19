import React, { useState } from 'react';
import { X, UserPlus, Gamepad2, Briefcase, Target, Trophy, MapPin, Clock, Users, DollarSign } from 'lucide-react';
import config from '../config/config';

interface CreatePlayerProfileModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePlayerProfileModal: React.FC<CreatePlayerProfileModalProps> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(0);
  const [profileType, setProfileType] = useState<'looking-for-team' | 'staff-position' | null>(null);
  const [formData, setFormData] = useState({
    game: '',
    role: '',
    staffRole: '',
    playerInfo: {
      playerName: '',
      currentRank: '',
      experienceLevel: '',
      tournamentExperience: '',
      achievements: '',
      availability: '',
      languages: '',
      additionalInfo: ''
    },
    professionalInfo: {
      fullName: '',
      experienceLevel: '',
      availability: '',
      preferredLocation: '',
      skillsAndExpertise: '',
      professionalAchievements: '',
      portfolio: ''
    },
    expectations: {
      expectedSalary: '',
      compensationPreference: '',
      teamType: '',
      preferredLocation: '',
      additionalInfo: '',
      contactInformation: ''
    }
  });

  const games = [
    'BGMI', 'Valorant', 'Free Fire', 'Call of Duty Mobile', 
    'CS:GO', 'Fortnite', 'Apex Legends', 'League of Legends', 'Dota 2'
  ];

  const rosterRoles = {
    'BGMI': ['IGL', 'Assaulter', 'Support', 'Sniper'],
    'Valorant': ['Duelist', 'Controller', 'Initiator', 'Sentinel'],
    'Free Fire': ['Rusher', 'Support', 'Sniper', 'IGL'],
    'Call of Duty Mobile': ['Assault', 'SMG', 'Sniper', 'Support'],
    'CS:GO': ['Entry Fragger', 'Support', 'AWPer', 'IGL', 'Lurker'],
    'Fortnite': ['Builder', 'Fighter', 'Support', 'IGL'],
    'Apex Legends': ['Fragger', 'Support', 'IGL', 'Flex'],
    'League of Legends': ['Top', 'Jungle', 'Mid', 'ADC', 'Support'],
    'Dota 2': ['Carry', 'Mid', 'Offlane', 'Support', 'Hard Support']
  };

  const staffRoles = [
    'Coach', 'Manager', 'Content Creator', 'Video Editor', 'Social Media Manager', 
    'GFX Artist', 'Scrims Manager', 'Tournament Manager', 'Analyst', 'Stream Manager'
  ];

  const ranks = [
    'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 
    'Master', 'Grandmaster', 'Challenger', 'Immortal', 'Radiant'
  ];

  const experienceLevels = [
    'Beginner', 'Intermediate', 'Advanced', 'Professional', 'Expert'
  ];

  const competitiveExperiences = [
    'No Experience', 'Local Tournaments', 'Regional Tournaments', 
    'National Tournaments', 'International Tournaments'
  ];

  const teamTypes = ['Casual', 'Competitive', 'Professional', 'Any'];

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        profileType,
        game: formData.game,
        role: profileType === 'looking-for-team' ? formData.role : undefined,
        staffRole: profileType === 'staff-position' ? formData.staffRole : undefined,
        playerInfo: profileType === 'looking-for-team' ? formData.playerInfo : undefined,
        professionalInfo: profileType === 'staff-position' ? formData.professionalInfo : undefined,
        expectations: formData.expectations
      };

      console.log('Submitting profile data:', payload);

      const response = await fetch(`${config.apiUrl}/api/recruitment/player-profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('Response:', data);
      
      if (data.success) {
        onSuccess();
      } else {
        console.error('Error creating profile:', data.message);
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      alert(`Error: ${errorMessage}`);
    }
  };

  const canProceedToStep1 = () => {
    return profileType !== null;
  };

  const canProceedToStep2 = () => {
    if (profileType === 'looking-for-team') {
      return formData.game && formData.role;
    } else {
      return formData.staffRole;
    }
  };

  const canProceedToStep3 = () => {
    if (profileType === 'looking-for-team') {
      return formData.playerInfo.playerName && formData.playerInfo.currentRank;
    } else {
      return formData.professionalInfo.fullName && formData.professionalInfo.skillsAndExpertise;
    }
  };

  const renderStep0 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Choose Recruitment Type</h2>
        <p className="text-gray-400">Select how you want to showcase yourself</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => setProfileType('looking-for-team')}
          className={`p-6 rounded-lg border-2 transition-all duration-200 ${
            profileType === 'looking-for-team'
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-gray-600 hover:border-gray-500'
          }`}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎮</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Looking for Team</h3>
            <p className="text-gray-400 text-sm mb-4">
              Showcase your gaming skills and find the perfect team
            </p>
            <div className="text-left space-y-2">
              <div className="flex items-center text-green-400 text-sm">
                <span className="mr-2">✓</span>
                <span>Game & role showcase</span>
              </div>
              <div className="flex items-center text-green-400 text-sm">
                <span className="mr-2">✓</span>
                <span>Achievements & experience</span>
              </div>
              <div className="flex items-center text-green-400 text-sm">
                <span className="mr-2">✓</span>
                <span>Team preferences</span>
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => setProfileType('staff-position')}
          className={`p-6 rounded-lg border-2 transition-all duration-200 ${
            profileType === 'staff-position'
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-600 hover:border-gray-500'
          }`}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Staff Position</h3>
            <p className="text-gray-400 text-sm mb-4">
              Apply for staff positions in esports organizations
            </p>
            <div className="text-left space-y-2">
              <div className="flex items-center text-green-400 text-sm">
                <span className="mr-2">✓</span>
                <span>Professional skills</span>
              </div>
              <div className="flex items-center text-green-400 text-sm">
                <span className="mr-2">✓</span>
                <span>Portfolio showcase</span>
              </div>
              <div className="flex items-center text-green-400 text-sm">
                <span className="mr-2">✓</span>
                <span>Career opportunities</span>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          {profileType === 'looking-for-team' ? 'Select Game & Role' : 'Select Staff Role'}
        </h2>
        <p className="text-gray-400">
          {profileType === 'looking-for-team' 
            ? 'Choose the game and role for your profile' 
            : 'Choose the staff role you want to apply for'
          }
        </p>
      </div>

      <div className="space-y-4">
        {profileType === 'looking-for-team' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Game</label>
            <select
              value={formData.game}
              onChange={(e) => handleInputChange('game', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a game</option>
              {games.map(game => (
                <option key={game} value={game}>{game}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {profileType === 'looking-for-team' ? 'Role' : 'Staff Role'}
          </label>
          <select
            value={profileType === 'looking-for-team' ? formData.role : formData.staffRole}
            onChange={(e) => handleInputChange(
              profileType === 'looking-for-team' ? 'role' : 'staffRole', 
              e.target.value
            )}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a role</option>
            {profileType === 'looking-for-team' && formData.game && rosterRoles[formData.game as keyof typeof rosterRoles]?.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
            {profileType === 'staff-position' && staffRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          {profileType === 'looking-for-team' ? 'Your Profile & Experience' : 'Your Professional Profile'}
        </h2>
        <p className="text-gray-400">
          {profileType === 'looking-for-team' 
            ? 'Tell teams about your gaming experience and achievements' 
            : 'Tell organizations about your professional skills and experience'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {profileType === 'looking-for-team' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Player Name/IGN</label>
              <input
                type="text"
                placeholder="Your in-game name"
                value={formData.playerInfo.playerName}
                onChange={(e) => handleInputChange('playerInfo.playerName', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Current Rank</label>
              <select
                value={formData.playerInfo.currentRank}
                onChange={(e) => handleInputChange('playerInfo.currentRank', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select your current rank</option>
                {ranks.map(rank => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Game Experience</label>
              <input
                type="text"
                value={formData.playerInfo.experienceLevel}
                onChange={(e) => handleInputChange('playerInfo.experienceLevel', e.target.value)}
                placeholder="e.g., 2 years, 18 months, 3+ years"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Competitive Experience</label>
              <input
                type="text"
                value={formData.playerInfo.tournamentExperience}
                onChange={(e) => handleInputChange('playerInfo.tournamentExperience', e.target.value)}
                placeholder="e.g., 1 year competitive, 6 months tournaments, 2+ years pro"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Availability</label>
              <input
                type="text"
                placeholder="e.g., 6-8 hours daily, Weekends only, Flexible"
                value={formData.playerInfo.availability}
                onChange={(e) => handleInputChange('playerInfo.availability', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Languages</label>
              <input
                type="text"
                placeholder="e.g., English, Hindi, Tamil, Telugu"
                value={formData.playerInfo.languages}
                onChange={(e) => handleInputChange('playerInfo.languages', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Achievements & Highlights</label>
              <textarea
                placeholder="Describe your achievements, tournament wins, notable performances, etc..."
                value={formData.playerInfo.achievements}
                onChange={(e) => handleInputChange('playerInfo.achievements', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <input
                type="text"
                placeholder="Your full name"
                value={formData.professionalInfo.fullName}
                onChange={(e) => handleInputChange('professionalInfo.fullName', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Professional Experience</label>
              <input
                type="text"
                value={formData.professionalInfo.experienceLevel}
                onChange={(e) => handleInputChange('professionalInfo.experienceLevel', e.target.value)}
                placeholder="e.g., 3 years in esports, 2 years management, 5+ years industry"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Availability</label>
              <select
                value={formData.professionalInfo.availability}
                onChange={(e) => handleInputChange('professionalInfo.availability', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select your availability</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Freelance">Freelance</option>
                <option value="Contract">Contract</option>
                <option value="Flexible">Flexible</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Location</label>
              <input
                type="text"
                placeholder="e.g., Delhi, Mumbai, Remote, Any"
                value={formData.professionalInfo.preferredLocation}
                onChange={(e) => handleInputChange('professionalInfo.preferredLocation', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Skills & Expertise</label>
              <textarea
                placeholder="List your specific skills, software proficiency, tools, and areas of expertise..."
                value={formData.professionalInfo.skillsAndExpertise}
                onChange={(e) => handleInputChange('professionalInfo.skillsAndExpertise', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Professional Achievements</label>
              <textarea
                placeholder="Describe your professional achievements, certifications, notable projects, etc..."
                value={formData.professionalInfo.professionalAchievements}
                onChange={(e) => handleInputChange('professionalInfo.professionalAchievements', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Portfolio/Previous Work</label>
              <textarea
                placeholder="Describe your portfolio, previous work samples, or provide links to your work..."
                value={formData.professionalInfo.portfolio}
                onChange={(e) => handleInputChange('professionalInfo.portfolio', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          {profileType === 'looking-for-team' ? 'Team Preferences & Contact' : 'Expectations & Contact'}
        </h2>
        <p className="text-gray-400">
          {profileType === 'looking-for-team' 
            ? 'Tell teams what you\'re looking for and how to contact you' 
            : 'Tell organizations what you expect and how to contact you'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {profileType === 'looking-for-team' && (
          <>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Team Type</label>
              <select
                value={formData.expectations.teamType}
                onChange={(e) => handleInputChange('expectations.teamType', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select preferred team type</option>
                {teamTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Compensation Preference</label>
              <select
                value={formData.expectations.compensationPreference || ''}
                onChange={(e) => handleInputChange('expectations.compensationPreference', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select compensation preference</option>
                <option value="No Salary - Just for Experience">No Salary - Just for Experience</option>
                <option value="Share Based - Winnings Share">Share Based - Winnings Share</option>
                <option value="Fixed Salary + Share">Fixed Salary + Share</option>
                <option value="Negotiable">Negotiable</option>
                <option value="Any">Any</option>
              </select>
            </div>
          </>
        )}


        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Location</label>
          <input
            type="text"
            placeholder="e.g., Delhi, Mumbai, Remote, Any"
            value={formData.expectations.preferredLocation}
            onChange={(e) => handleInputChange('expectations.preferredLocation', e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">Additional Information</label>
          <textarea
            placeholder={profileType === 'looking-for-team' 
              ? "Any additional information about yourself, preferences, or requirements..." 
              : "Any additional information about yourself, work preferences, or requirements..."
            }
            value={formData.expectations.additionalInfo}
            onChange={(e) => handleInputChange('expectations.additionalInfo', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">Contact Information *</label>
          <textarea
            placeholder={profileType === 'looking-for-team' 
              ? "How should teams contact you? (Discord, WhatsApp, Email, etc.)" 
              : "How should organizations contact you? (Email, LinkedIn, WhatsApp, etc.)"
            }
            value={formData.expectations.contactInformation}
            onChange={(e) => handleInputChange('expectations.contactInformation', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Post Recruitment</h2>
              <p className="text-gray-400">Choose how you want to showcase yourself to teams</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= stepNum 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    step > stepNum ? 'bg-blue-600' : 'bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-400">
            <span>Game & Role</span>
            <span>{profileType === 'looking-for-team' ? 'Profile & Experience' : 'Professional Profile'}</span>
            <span>{profileType === 'looking-for-team' ? 'Team Preferences' : 'Expectations'}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-800">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <span>Previous</span>
          </button>

          <div className="flex space-x-3">
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 0 ? !canProceedToStep1() : step === 1 ? !canProceedToStep2() : !canProceedToStep3()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!formData.expectations.contactInformation}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Trophy className="w-4 h-4" />
                <span>{profileType === 'looking-for-team' ? 'Post Player Recruitment' : 'Post Staff Recruitment'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePlayerProfileModal;
