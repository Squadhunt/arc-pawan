import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Settings as SettingsIcon, 
  Save, 
  ArrowLeft,
  Camera,
  MapPin,
  Mail,
  Gamepad2,
  Shield,
  Bell,
  Palette,
  Trash2,
  AlertTriangle,
  X,
  LogOut,
  Home,
  Search,
  Trophy,
  Briefcase
} from 'lucide-react';
import axios from 'axios';
import MobileBottomNav from '../components/MobileBottomNav';

interface ProfileFormData {
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
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
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

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
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
        socialLinks: formData.socialLinks
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        // Update the user context with new data
        if (updateUser) {
          updateUser(response.data.data.user);
        }
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
        setMessage({ type: 'success', text: 'Account deleted successfully. You will be redirected to login.' });
        // Clear user data and redirect to login
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error deleting account:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to delete account. Please try again.' 
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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setMessage({ type: 'error', text: 'Logout failed. Please try again.' });
    }
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
    <div className="min-h-screen bg-black pt-4 md:pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2 w-fit"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center space-x-2 sm:space-x-3">
                <SettingsIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                <span>Settings</span>
              </h1>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">Manage your profile and preferences</p>
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
          {/* Account Settings */}
          <div className="card">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center space-x-2">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <span>Account Settings</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your username"
                />
                <p className="text-xs text-gray-400 mt-1">Username can only contain letters, numbers, and underscores</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed"
                  placeholder="Email cannot be changed"
                />
                <p className="text-xs text-gray-400 mt-1">Email address cannot be modified</p>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="card">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center space-x-2">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <span>Profile Information</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your display name"
                />
              </div>
              
              <div>
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
                    placeholder="Enter your location"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Tell us about yourself..."
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
                  placeholder="Discord username"
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
                  placeholder="Steam profile URL"
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

          {/* Save Button */}
          <div className="flex justify-center sm:justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 w-full sm:w-auto"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>

          {/* Danger Zone */}
          <div className="card border-red-500/20">
            <h3 className="text-lg sm:text-xl font-bold text-red-400 mb-4 sm:mb-6 flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
              <span>Danger Zone</span>
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-red-900/10 border border-red-500/20 rounded-lg">
                <h4 className="text-red-300 font-semibold mb-2">Delete Account</h4>
                <p className="text-gray-400 text-sm mb-4">
                  Once you delete your account, there is no going back. This action cannot be undone.
                  All your data, posts, and connections will be permanently removed.
                </p>
                <button
                  type="button"
                  onClick={openDeleteDialog}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Logout Button */}
        <div className="mt-8 mb-20 lg:mb-8 flex justify-center">
          <button
            onClick={handleLogout}
            className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2 border border-gray-700"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>

        {/* Delete Account Confirmation Dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-red-400 flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Delete Account</span>
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
                  Are you sure you want to delete your account? This action cannot be undone.
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
                        <span>Delete Account</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default Settings;
