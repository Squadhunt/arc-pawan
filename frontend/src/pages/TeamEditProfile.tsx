import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  Save, 
  ArrowLeft,
  MapPin,
  Mail,
  Gamepad2,
  Shield,
  Crown,
  Trash2,
  Camera,
  Upload,
  Image as ImageIcon,
  X,
  AlertTriangle
} from 'lucide-react';
import axios from 'axios';

interface TeamProfileFormData {
  username: string;
  displayName: string;
  bio: string;
  location: string;
  gamingPreferences: string[];
  socialLinks: {
    discord: string;
    steam: string;
    twitch: string;
  };
  teamInfo: {
    teamSize: number;
    recruitingFor: string[];
    requirements: string;
    teamType: string;
  };
}

const TeamEditProfile: React.FC = () => {
  const { id: teamId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<TeamProfileFormData>({
    username: '',
    displayName: '',
    bio: '',
    location: '',
    gamingPreferences: [],
    socialLinks: {
      discord: '',
      steam: '',
      twitch: ''
    },
    teamInfo: {
      teamSize: 0,
      recruitingFor: [],
      requirements: '',
      teamType: 'Casual'
    }
  });

  const [newGamingPreference, setNewGamingPreference] = useState('');
  const [newRecruitingFor, setNewRecruitingFor] = useState('');
  const [profileImage, setProfileImage] = useState<string>('');
  const [bannerImage, setBannerImage] = useState<string>('');

  useEffect(() => {
    if (teamId && currentUser?._id === teamId) {
      fetchTeamProfile();
    } else {
      navigate('/');
    }
  }, [teamId, currentUser, navigate]);

  const fetchTeamProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/users/${teamId}`);
      const teamData = response.data.data?.user;
      
      if (teamData) {
        setFormData({
          username: teamData.username || '',
          displayName: teamData.profile?.displayName || '',
          bio: teamData.profile?.bio || '',
          location: teamData.profile?.location || '',
          gamingPreferences: teamData.profile?.gamingPreferences || [],
          socialLinks: {
            discord: teamData.profile?.socialLinks?.discord || '',
            steam: teamData.profile?.socialLinks?.steam || '',
            twitch: teamData.profile?.socialLinks?.twitch || ''
          },
          teamInfo: {
            teamSize: teamData.teamInfo?.teamSize || 0,
            recruitingFor: teamData.teamInfo?.recruitingFor || [],
            requirements: teamData.teamInfo?.requirements || '',
            teamType: teamData.teamInfo?.teamType || 'Casual'
          }
        });
        setProfileImage(teamData.profile?.avatar || teamData.profilePicture || '');
        setBannerImage(teamData.profile?.banner || '');
      }
    } catch (error) {
      console.error('Error fetching team profile:', error);
      setMessage({ type: 'error', text: 'Failed to load team profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof TeamProfileFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTeamInfoChange = (field: keyof TeamProfileFormData['teamInfo'], value: string | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      teamInfo: {
        ...prev.teamInfo,
        [field]: value
      }
    }));
  };

  const handleSocialLinkChange = (platform: keyof TeamProfileFormData['socialLinks'], value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  const addGamingPreference = () => {
    if (newGamingPreference.trim() && !formData.gamingPreferences.includes(newGamingPreference.trim())) {
      setFormData(prev => ({
        ...prev,
        gamingPreferences: [...prev.gamingPreferences, newGamingPreference.trim()]
      }));
      setNewGamingPreference('');
    }
  };

  const removeGamingPreference = (preference: string) => {
    setFormData(prev => ({
      ...prev,
      gamingPreferences: prev.gamingPreferences.filter(p => p !== preference)
    }));
  };

  const addRecruitingFor = () => {
    if (newRecruitingFor.trim() && !formData.teamInfo.recruitingFor.includes(newRecruitingFor.trim())) {
      setFormData(prev => ({
        ...prev,
        teamInfo: {
          ...prev.teamInfo,
          recruitingFor: [...prev.teamInfo.recruitingFor, newRecruitingFor.trim()]
        }
      }));
      setNewRecruitingFor('');
    }
  };

  const removeRecruitingFor = (position: string) => {
    setFormData(prev => ({
      ...prev,
      teamInfo: {
        ...prev.teamInfo,
        recruitingFor: prev.teamInfo.recruitingFor.filter(p => p !== position)
      }
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file.' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 5MB.' });
      return;
    }

    setUploadingImage(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post('/api/auth/upload-profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setProfileImage(response.data.data.imageUrl);
        setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
        
        // Update user context
        if (updateUser && currentUser) {
          updateUser({ 
            ...currentUser, 
            profile: { 
              ...currentUser.profile, 
              avatar: response.data.data.imageUrl,
              displayName: currentUser.profile?.displayName || ''
            } 
          });
        }
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to upload image. Please try again.' 
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file.' });
      return;
    }

    // Validate file size (max 10MB for banners)
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Banner size must be less than 10MB.' });
      return;
    }

    setUploadingBanner(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post('/api/auth/upload-banner', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setBannerImage(response.data.data.imageUrl);
        setMessage({ type: 'success', text: 'Banner updated successfully!' });
        
        // Update user context
        if (updateUser && currentUser) {
          updateUser({ 
            ...currentUser, 
            profile: { 
              ...currentUser.profile, 
              banner: response.data.data.imageUrl,
              displayName: currentUser.profile?.displayName || ''
            } 
          });
        }
      }
    } catch (error: any) {
      console.error('Error uploading banner:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to upload banner. Please try again.' 
      });
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await axios.put('/api/auth/profile', {
        username: formData.username,
        displayName: formData.displayName,
        bio: formData.bio,
        location: formData.location,
        gamingPreferences: formData.gamingPreferences,
        socialLinks: formData.socialLinks,
        teamInfo: formData.teamInfo
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Team profile updated successfully!' });
        // Update the user context with new data
        if (updateUser) {
          updateUser(response.data.data.user);
        }
        // Navigate back to team profile after a short delay
        setTimeout(() => {
          navigate(`/team/${teamId}`);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error updating team profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update team profile. Please try again.' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setMessage({ type: 'error', text: 'Please enter your password to delete account' });
      return;
    }

    setDeleting(true);
    setMessage(null);

    try {
      const response = await axios.delete('/api/auth/account', {
        data: { password: deletePassword }
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Team account deleted successfully. You will be redirected to login.' });
        // Clear user data and redirect to login
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error deleting team account:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to delete team account. Please try again.' 
      });
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteDialog = () => {
    setShowDeleteDialog(true);
    setDeletePassword('');
    setMessage(null);
  };

  const closeDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeletePassword('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-800 rounded-lg mb-6 shimmer"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-800 rounded-lg shimmer"></div>
              <div className="h-32 bg-gray-800 rounded-lg shimmer"></div>
              <div className="h-32 bg-gray-800 rounded-lg shimmer"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => navigate(`/team/${teamId}`)}
              className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2 w-fit"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Team</span>
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center space-x-2 sm:space-x-3">
                <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400" />
                <span>Edit Team Profile</span>
              </h1>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">Manage your team's profile and information</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-900/20 border border-green-500/50 text-green-300'
              : 'bg-red-900/20 border border-red-500/50 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Profile Picture and Banner */}
          <div className="card">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center space-x-2">
              <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <span>Profile Images</span>
            </h3>
            
            <div className="space-y-8">
              {/* Profile Picture Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Profile Picture */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Team Profile Picture
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-gray-800 border-2 border-gray-700 flex items-center justify-center">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Team Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="h-8 w-8 sm:h-12 sm:w-12 text-gray-500" />
                      )}
                    </div>
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-3">
                      Upload a profile picture to represent your team. Supported formats: JPG, PNG, GIF (max 5MB)
                    </p>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        <Upload className="h-4 w-4" />
                        <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                      </button>
                      {profileImage && (
                        <button
                          type="button"
                          onClick={() => setProfileImage('')}
                          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                        >
                          <X className="h-4 w-4" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              </div>

              {/* Banner Section - Full Width */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Team Banner
                </label>
                <div className="flex flex-col space-y-4">
                  <div className="relative">
                    <div className="w-full h-40 sm:h-48 md:h-56 rounded-lg overflow-hidden bg-gray-800 border-2 border-gray-700 flex items-center justify-center">
                      {bannerImage ? (
                        <img
                          src={bannerImage}
                          alt="Team Banner"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-16 w-16 sm:h-20 sm:w-20 text-gray-500" />
                      )}
                    </div>
                    {uploadingBanner && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-3">
                      Upload a banner image for your team profile. Recommended: 1200x300px (max 10MB)
                    </p>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <button
                        type="button"
                        onClick={() => bannerInputRef.current?.click()}
                        disabled={uploadingBanner}
                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        <Upload className="h-4 w-4" />
                        <span>{uploadingBanner ? 'Uploading...' : 'Upload Banner'}</span>
                      </button>
                      {bannerImage && (
                        <button
                          type="button"
                          onClick={() => setBannerImage('')}
                          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                        >
                          <X className="h-4 w-4" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Basic Information */}
          <div className="card">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center space-x-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <span>Team Information</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Team Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter team username"
                />
                <p className="text-xs text-gray-400 mt-1">Username can only contain letters, numbers, and underscores</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Team Display Name
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter team display name"
                />
              </div>
            </div>
            
            <div className="mt-4 sm:mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Team Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Tell us about your team..."
              />
            </div>

            <div className="mt-4 sm:mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter team location"
                />
              </div>
            </div>
          </div>

          {/* Team Details */}
          <div className="card">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center space-x-2">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <span>Team Details</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Team Size
                </label>
                <input
                  type="number"
                  value={formData.teamInfo.teamSize}
                  onChange={(e) => handleTeamInfoChange('teamSize', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter team size"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Team Type
                </label>
                <select
                  value={formData.teamInfo.teamType}
                  onChange={(e) => handleTeamInfoChange('teamType', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Casual">Casual</option>
                  <option value="Competitive">Competitive</option>
                  <option value="Professional">Professional</option>
                  <option value="Semi-Pro">Semi-Pro</option>
                </select>
              </div>
            </div>

            <div className="mt-4 sm:mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Team Requirements
              </label>
              <textarea
                value={formData.teamInfo.requirements}
                onChange={(e) => handleTeamInfoChange('requirements', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe your team requirements..."
              />
            </div>
          </div>

          {/* Gaming Preferences */}
          <div className="card">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center space-x-2">
              <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <span>Gaming Preferences</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="text"
                  value={newGamingPreference}
                  onChange={(e) => setNewGamingPreference(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGamingPreference())}
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a gaming preference (e.g., FPS, RPG, Strategy)"
                />
                <button
                  type="button"
                  onClick={addGamingPreference}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors border border-gray-700 w-full sm:w-auto"
                >
                  Add
                </button>
              </div>
              
              {formData.gamingPreferences.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.gamingPreferences.map((preference, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center space-x-2 px-3 py-1 bg-gray-800/20 text-gray-400 rounded-lg border border-gray-700/30"
                    >
                      <span>{preference}</span>
                      <button
                        type="button"
                        onClick={() => removeGamingPreference(preference)}
                        className="text-gray-400 hover:text-white"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recruiting For */}
          <div className="card">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center space-x-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <span>Currently Recruiting For</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="text"
                  value={newRecruitingFor}
                  onChange={(e) => setNewRecruitingFor(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRecruitingFor())}
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a position (e.g., IGL, Support, Coach)"
                />
                <button
                  type="button"
                  onClick={addRecruitingFor}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors border border-gray-700 w-full sm:w-auto"
                >
                  Add
                </button>
              </div>
              
              {formData.teamInfo.recruitingFor.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.teamInfo.recruitingFor.map((position, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30"
                    >
                      <span>{position}</span>
                      <button
                        type="button"
                        onClick={() => removeRecruitingFor(position)}
                        className="text-blue-400 hover:text-white"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="card">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center space-x-2">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <span>Social Links</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Discord
                </label>
                <input
                  type="text"
                  value={formData.socialLinks.discord}
                  onChange={(e) => handleSocialLinkChange('discord', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Discord server invite"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Steam
                </label>
                <input
                  type="text"
                  value={formData.socialLinks.steam}
                  onChange={(e) => handleSocialLinkChange('steam', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Steam group URL"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Twitch
                </label>
                <input
                  type="text"
                  value={formData.socialLinks.twitch}
                  onChange={(e) => handleSocialLinkChange('twitch', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Twitch channel"
                />
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card border-red-500/20">
            <h3 className="text-lg sm:text-xl font-bold text-red-400 mb-4 sm:mb-6 flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
              <span>Danger Zone</span>
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-red-900/10 border border-red-500/20 rounded-lg">
                <h4 className="text-red-300 font-semibold mb-2">Delete Team Account</h4>
                <p className="text-gray-400 text-sm mb-4">
                  Once you delete your team account, there is no going back. This action cannot be undone.
                  All team data, rosters, staff, posts, and connections will be permanently removed.
                </p>
                <button
                  type="button"
                  onClick={openDeleteDialog}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Team Account</span>
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-center sm:justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>

        {/* Delete Account Confirmation Dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-red-400 flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Delete Team Account</span>
                </h3>
                <button
                  onClick={closeDeleteDialog}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-300">
                  Are you sure you want to delete your team account? This action cannot be undone.
                  All team data, rosters, staff members, and posts will be permanently removed.
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Enter your password to confirm
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={closeDeleteDialog}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting || !deletePassword.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    {deleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Team</span>
                      </>
                    )}
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

export default TeamEditProfile;
