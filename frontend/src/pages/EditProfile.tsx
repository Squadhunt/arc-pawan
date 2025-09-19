import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Camera, 
  Save, 
  ArrowLeft,
  MapPin,
  Mail,
  Gamepad2,
  Trash2,
  Plus,
  X,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import axios from 'axios';

interface ProfileFormData {
  displayName: string;
  bio: string;
  location: string;
  gamingPreferences: string[];
  socialLinks: {
    discord: string;
    steam: string;
    twitch: string;
  };
}

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: '',
    bio: '',
    location: '',
    gamingPreferences: [],
    socialLinks: {
      discord: '',
      steam: '',
      twitch: ''
    }
  });

  const [newGamingPreference, setNewGamingPreference] = useState('');
  const [profileImage, setProfileImage] = useState<string>('');

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.profile?.displayName || '',
        bio: user.profile?.bio || '',
        location: user.profile?.location || '',
        gamingPreferences: user.profile?.gamingPreferences || [],
        socialLinks: {
          discord: user.profile?.socialLinks?.discord || '',
          steam: user.profile?.socialLinks?.steam || '',
          twitch: user.profile?.socialLinks?.twitch || ''
        }
      });
      setProfileImage(user.profile?.avatar || user.profilePicture || '');
    }
  }, [user]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialLinkChange = (platform: keyof ProfileFormData['socialLinks'], value: string) => {
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
         if (updateUser && user) {
           updateUser({ 
             ...user, 
             profile: { 
               ...user.profile, 
               avatar: response.data.data.imageUrl,
               displayName: user.profile?.displayName || ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await axios.put('/api/auth/profile', {
        displayName: formData.displayName,
        bio: formData.bio,
        location: formData.location,
        gamingPreferences: formData.gamingPreferences,
        socialLinks: formData.socialLinks
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        // Update the user context with new data
        if (updateUser) {
          updateUser(response.data.data.user);
        }
        
        // Navigate back to profile after a short delay
        setTimeout(() => {
          navigate(`/profile/${user?._id}`);
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile. Please try again.' 
      });
    } finally {
      setSaving(false);
    }
  };

  const getProfilePicture = () => {
    return profileImage || user?.profile?.avatar || user?.profilePicture || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNjAiIHI9IjYwIiBmaWxsPSIjMzczNzNBIi8+CjxwYXRoIGQ9Ik02MCAzMEM2Ni4yNzQxIDMwIDcxLjQgMzUuMTI1OSA3MS40IDQxLjRDNzEuNCA0Ny42NzQxIDY2LjI3NDEgNTIuOCA2MCA1Mi44QzUzLjcyNTkgNTIuOCA0OC42IDQ3LjY3NDEgNDguNiA0MS40QzQ4LjYgMzUuMTI1OSA1My43MjU5IDMwIDYwIDMwWiIgZmlsbD0iIzZCNkI2QiIvPgo8cGF0aCBkPSJNODQgOTBDODQgNzguOTU0MyA3My4wNDU3IDY4IDYwIDY4QzQ2Ljk1NDMgNjggMzYgNzguOTU0MyAzNiA5MEg4NFoiIGZpbGw9IiM2QjZCNkIiLz4KPC9zdmc+Cg==';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse">
            <div className="h-12 bg-secondary-800 rounded-xl mb-6 shimmer"></div>
            <div className="space-y-4">
              <div className="h-32 bg-secondary-800 rounded-xl shimmer"></div>
              <div className="h-32 bg-secondary-800 rounded-xl shimmer"></div>
              <div className="h-32 bg-secondary-800 rounded-xl shimmer"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark pt-16 sm:pt-24 pb-20 sm:pb-0">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="btn-secondary flex items-center space-x-2 px-3 py-2 text-sm sm:text-base"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="flex-1 text-center sm:text-left sm:ml-4">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3">
                <User className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary-500" />
                <span>Edit Profile</span>
              </h1>
              <p className="text-secondary-400 mt-1 text-xs sm:text-sm lg:text-base">Customize your gaming profile</p>
            </div>
            <div className="w-16"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl border-2 ${
            message.type === 'success' 
              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border-red-500/30'
          }`}>
            <div className="flex items-start justify-between space-x-2">
              <span className="font-medium text-sm sm:text-base flex-1">{message.text}</span>
              <button 
                onClick={() => setMessage(null)}
                className="text-secondary-400 hover:text-white transition-colors flex-shrink-0 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Profile Picture Section */}
          <div className="card">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-3 sm:mb-4 lg:mb-6 flex items-center space-x-2">
              <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500" />
              <span>Profile Picture</span>
            </h3>
            
            <div className="flex flex-col items-center sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="relative group">
                <img
                  src={getProfilePicture()}
                  alt="Profile"
                  className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-2xl object-cover border-4 border-primary-500/30 shadow-glow"
                />
                <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
              </div>
              
              <div className="flex-1 w-full text-center sm:text-left">
                <p className="text-secondary-300 mb-4 text-xs sm:text-sm lg:text-base">
                  Upload a profile picture to make your profile stand out. 
                  Supported formats: JPG, PNG, GIF (max 5MB)
                </p>
                
                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base"
                  >
                    {uploadingImage ? (
                      <>
                        <div className="loading-spinner w-4 h-4"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>Upload Image</span>
                      </>
                    )}
                  </button>
                  
                  {profileImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setProfileImage('');
                        setMessage({ type: 'success', text: 'Profile picture removed!' });
                      }}
                      className="btn-secondary flex items-center justify-center space-x-2 w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base"
                    >
                      <Trash2 className="h-4 w-4" />
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

          {/* Basic Information */}
          <div className="card">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-3 sm:mb-4 lg:mb-6 flex items-center space-x-2">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500" />
              <span>Basic Information</span>
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-secondary-800 border border-secondary-700 rounded-xl text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                  placeholder="Enter your display name"
                  maxLength={50}
                />
                <p className="text-xs text-secondary-400 mt-1">
                  {formData.displayName.length}/50 characters
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-secondary-800 border border-secondary-700 rounded-xl text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                    placeholder="Enter your location"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-6">
              <label className="block text-sm font-medium text-secondary-300 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-secondary-800 border border-secondary-700 rounded-xl text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all duration-300 text-sm sm:text-base"
                placeholder="Tell us about yourself, your gaming experience, and what you're looking for..."
                maxLength={500}
              />
              <p className="text-xs text-secondary-400 mt-1">
                {formData.bio.length}/500 characters
              </p>
            </div>
          </div>

          {/* Gaming Preferences */}
          <div className="card">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-3 sm:mb-4 lg:mb-6 flex items-center space-x-2">
              <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500" />
              <span>Gaming Preferences</span>
            </h3>
            
            <div className="space-y-4">
              <p className="text-secondary-300 text-xs sm:text-sm">
                Add your favorite game genres, games, or gaming interests to help others discover you.
              </p>
              
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-2">
                <input
                  type="text"
                  value={newGamingPreference}
                  onChange={(e) => setNewGamingPreference(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGamingPreference())}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-secondary-800 border border-secondary-700 rounded-xl text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                  placeholder="Add a gaming preference (e.g., FPS, RPG, Strategy, Valorant, CS2)"
                />
                <button
                  type="button"
                  onClick={addGamingPreference}
                  disabled={!newGamingPreference.trim()}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 w-full sm:w-auto text-sm sm:text-base"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add</span>
                </button>
              </div>
              
              {formData.gamingPreferences.length > 0 && (
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {formData.gamingPreferences.map((preference, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-500/20 text-primary-400 rounded-xl border border-primary-500/30 hover:bg-primary-500/30 transition-colors text-sm"
                    >
                      <span className="font-medium">{preference}</span>
                      <button
                        type="button"
                        onClick={() => removeGamingPreference(preference)}
                        className="text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="card">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-3 sm:mb-4 lg:mb-6 flex items-center space-x-2">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500" />
              <span>Social Links</span>
            </h3>
            
            <p className="text-secondary-300 text-xs sm:text-sm mb-4 sm:mb-6">
              Connect your gaming profiles to help others find you on different platforms.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Discord
                </label>
                <input
                  type="text"
                  value={formData.socialLinks.discord}
                  onChange={(e) => handleSocialLinkChange('discord', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-secondary-800 border border-secondary-700 rounded-xl text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                  placeholder="Discord username"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Steam
                </label>
                <input
                  type="text"
                  value={formData.socialLinks.steam}
                  onChange={(e) => handleSocialLinkChange('steam', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-secondary-800 border border-secondary-700 rounded-xl text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                  placeholder="Steam profile URL"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Twitch
                </label>
                <input
                  type="text"
                  value={formData.socialLinks.twitch}
                  onChange={(e) => handleSocialLinkChange('twitch', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-secondary-800 border border-secondary-700 rounded-xl text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                  placeholder="Twitch channel"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex flex-col sm:flex-row justify-center sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4 sticky bottom-4 sm:bottom-0 bg-gradient-dark pt-4 sm:pt-0 -mx-3 sm:-mx-0 px-3 sm:px-0">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary w-full sm:w-auto px-4 py-3 text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto px-4 py-3 text-sm sm:text-base"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
