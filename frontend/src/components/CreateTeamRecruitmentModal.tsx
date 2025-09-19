import React, { useState } from 'react';
import { X, Gamepad2, Shield, Briefcase, Target, Trophy, MapPin, Clock, Users, DollarSign } from 'lucide-react';
import config from '../config/config';

interface CreateTeamRecruitmentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTeamRecruitmentModal: React.FC<CreateTeamRecruitmentModalProps> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(0);
  const [recruitmentType, setRecruitmentType] = useState<'roster' | 'staff' | null>(null);
  const [formData, setFormData] = useState({
    game: '',
    role: '',
    staffRole: '',
    requirements: {
      dailyPlayingTime: '',
      tournamentExperience: '',
      requiredDevice: '',
      experienceLevel: '',
      language: '',
      additionalRequirements: '',
      availability: '',
      requiredSkills: '',
      portfolioRequirements: ''
    },
    benefits: {
      salary: '',
      customSalary: '',
      location: '',
      benefitsAndPerks: '',
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
      const response = await fetch(`${config.apiUrl}/api/recruitment/team-recruitments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recruitmentType,
          game: formData.game,
          role: recruitmentType === 'roster' ? formData.role : undefined,
          staffRole: recruitmentType === 'staff' ? formData.staffRole : undefined,
          requirements: formData.requirements,
          benefits: formData.benefits
        })
      });

      const data = await response.json();
      if (data.success) {
        onSuccess();
      } else {
        console.error('Error creating recruitment:', data.message);
      }
    } catch (error) {
      console.error('Error creating recruitment:', error);
    }
  };

  const canProceedToStep1 = () => {
    return recruitmentType !== null;
  };

  const canProceedToStep2 = () => {
    if (recruitmentType === 'roster') {
      return formData.game && formData.role;
    } else if (recruitmentType === 'staff') {
      return formData.staffRole;
    }
    return false;
  };

  const canProceedToStep3 = () => {
    if (recruitmentType === 'roster') {
      return formData.requirements.experienceLevel || formData.requirements.dailyPlayingTime || formData.requirements.tournamentExperience;
    } else if (recruitmentType === 'staff') {
      return formData.requirements.experienceLevel || formData.requirements.availability;
    }
    return false;
  };

  const canSubmit = () => {
    return formData.benefits.contactInformation && formData.benefits.contactInformation.trim() !== '';
  };

  const renderStep0 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Choose Recruitment Type</h2>
        <p className="text-gray-400">Select what type of recruitment you want to create</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => setRecruitmentType('roster')}
          className={`p-6 rounded-lg border-2 transition-all duration-200 ${
            recruitmentType === 'roster'
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-gray-600 hover:border-gray-500'
          }`}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎮</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Roster Recruitment</h3>
            <p className="text-gray-400 text-sm mb-4">
              Recruit players for your gaming team
            </p>
            <div className="text-left space-y-2">
              <div className="flex items-center text-green-400 text-sm">
                <span className="mr-2">✓</span>
                <span>Game & role selection</span>
              </div>
              <div className="flex items-center text-green-400 text-sm">
                <span className="mr-2">✓</span>
                <span>Skill requirements</span>
              </div>
              <div className="flex items-center text-green-400 text-sm">
                <span className="mr-2">✓</span>
                <span>Team benefits</span>
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => setRecruitmentType('staff')}
          className={`p-6 rounded-lg border-2 transition-all duration-200 ${
            recruitmentType === 'staff'
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-600 hover:border-gray-500'
          }`}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Staff Recruitment</h3>
            <p className="text-gray-400 text-sm mb-4">
              Recruit staff for your esports organization
            </p>
            <div className="text-left space-y-2">
              <div className="flex items-center text-green-400 text-sm">
                <span className="mr-2">✓</span>
                <span>Staff role selection</span>
              </div>
              <div className="flex items-center text-green-400 text-sm">
                <span className="mr-2">✓</span>
                <span>Professional requirements</span>
              </div>
              <div className="flex items-center text-green-400 text-sm">
                <span className="mr-2">✓</span>
                <span>Compensation details</span>
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
        <h2 className="text-2xl font-bold text-white mb-2">Select Game & Role</h2>
        <p className="text-gray-400">Choose the game and role for your recruitment</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Game</label>
          <select
            value={formData.game}
            onChange={(e) => handleInputChange('game', e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select a game</option>
            {games.map(game => (
              <option key={game} value={game}>{game}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {recruitmentType === 'roster' ? 'Role' : 'Staff Role'}
          </label>
          <select
            value={recruitmentType === 'roster' ? formData.role : formData.staffRole}
            onChange={(e) => handleInputChange(
              recruitmentType === 'roster' ? 'role' : 'staffRole', 
              e.target.value
            )}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select a role</option>
            {recruitmentType === 'roster' && formData.game && rosterRoles[formData.game as keyof typeof rosterRoles]?.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
            {recruitmentType === 'staff' && staffRoles.map(role => (
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
          {recruitmentType === 'roster' ? 'Player Requirements' : 'Staff Requirements'}
        </h2>
        <p className="text-gray-400">
          {recruitmentType === 'roster' 
            ? 'Specify what you\'re looking for in a player' 
            : 'Specify what you\'re looking for in staff'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recruitmentType === 'roster' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Experience Level</label>
              <input
                type="text"
                placeholder="e.g., 3 years, Intermediate, Advanced, Professional, etc."
                value={formData.requirements.experienceLevel}
                onChange={(e) => handleInputChange('requirements.experienceLevel', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Daily Playing Time</label>
              <input
                type="text"
                placeholder="e.g., 6-8 hours daily, Flexible timing, Weekends only"
                value={formData.requirements.dailyPlayingTime}
                onChange={(e) => handleInputChange('requirements.dailyPlayingTime', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tournament Experience</label>
              <input
                type="text"
                placeholder="e.g., 2 years competitive, Local tournaments, Regional level, etc."
                value={formData.requirements.tournamentExperience}
                onChange={(e) => handleInputChange('requirements.tournamentExperience', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Required Device</label>
              <input
                type="text"
                placeholder="e.g., Android 10+, iPhone 12+, PC with GTX 1660+"
                value={formData.requirements.requiredDevice}
                onChange={(e) => handleInputChange('requirements.requiredDevice', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
              <input
                type="text"
                placeholder="e.g., English, Hindi, Tamil, Telugu"
                value={formData.requirements.language}
                onChange={(e) => handleInputChange('requirements.language', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Experience Level</label>
              <input
                type="text"
                placeholder="e.g., 3 years, Intermediate, Advanced, Professional, etc."
                value={formData.requirements.experienceLevel}
                onChange={(e) => handleInputChange('requirements.experienceLevel', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Availability</label>
              <input
                type="text"
                placeholder="e.g., Full-time, Part-time, Flexible, 6 hours daily, etc."
                value={formData.requirements.availability}
                onChange={(e) => handleInputChange('requirements.availability', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </>
        )}

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {recruitmentType === 'roster' ? 'Additional Requirements' : 'Required Skills'}
          </label>
          <textarea
            placeholder={recruitmentType === 'roster' 
              ? "Describe any additional requirements, skills, or preferences..." 
              : "List specific skills, software, or tools required for this position..."
            }
            value={recruitmentType === 'roster' 
              ? formData.requirements.additionalRequirements 
              : formData.requirements.requiredSkills
            }
            onChange={(e) => handleInputChange(
              recruitmentType === 'roster' 
                ? 'requirements.additionalRequirements' 
                : 'requirements.requiredSkills', 
              e.target.value
            )}
            rows={4}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {recruitmentType === 'staff' && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Portfolio/Previous Work</label>
            <textarea
              placeholder="Describe what kind of portfolio or previous work samples you're looking for..."
              value={formData.requirements.portfolioRequirements}
              onChange={(e) => handleInputChange('requirements.portfolioRequirements', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">What We Provide & Contact</h2>
        <p className="text-gray-400">Tell applicants what you offer and how to contact you</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Compensation Type</label>
          <select
            value={formData.benefits.salary}
            onChange={(e) => handleInputChange('benefits.salary', e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select compensation type</option>
            <option value="No Salary - Share Based">No Salary - Share Based</option>
            <option value="Fixed Salary + Share">Fixed Salary + Share</option>
            <option value="Share Only">Share Only</option>
            <option value="Negotiable">Negotiable</option>
            <option value="Other">Other (Specify below)</option>
          </select>
        </div>

        {formData.benefits.salary === 'Other' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Custom Compensation</label>
            <input
              type="text"
              placeholder="e.g., ₹25,000/month + 20% winnings share"
              value={formData.benefits.customSalary || ''}
              onChange={(e) => handleInputChange('benefits.customSalary', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
          <input
            type="text"
            placeholder="e.g., Delhi, Mumbai, Remote"
            value={formData.benefits.location}
            onChange={(e) => handleInputChange('benefits.location', e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Benefits & Perks</label>
          <textarea
            placeholder="Describe benefits like tournament prizes, equipment, training, etc..."
            value={formData.benefits.benefitsAndPerks}
            onChange={(e) => handleInputChange('benefits.benefitsAndPerks', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Contact Information *</label>
          <textarea
            placeholder="How should interested players contact you? (Discord, WhatsApp, Email, etc.)"
            value={formData.benefits.contactInformation}
            onChange={(e) => handleInputChange('benefits.contactInformation', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create Recruitment Post</h2>
              <p className="text-gray-400">Choose the type of recruitment you want to post</p>
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
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    step > stepNum ? 'bg-purple-600' : 'bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-400">
            <span>Game & Role</span>
            <span>Requirements</span>
            <span>Benefits & Contact</span>
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
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit()}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Trophy className="w-4 h-4" />
                <span>Create Recruitment Post</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTeamRecruitmentModal;
