import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Gamepad2, User, Users, Sparkles, ArrowRight, Shield, CheckCircle, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'player' as 'player' | 'team',
    displayName: '',
    bio: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  
  const { register, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Form validation function
  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 20) {
      errors.username = 'Username must be less than 20 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers and underscores';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Display name validation
    if (!formData.displayName.trim()) {
      errors.displayName = 'Display name is required';
    } else if (formData.displayName.length > 50) {
      errors.displayName = 'Display name must be less than 50 characters';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      });
    }

    // Real-time email validation
    if (name === 'email') {
      if (value.trim() === '') {
        setEmailValid(null);
      } else {
        setEmailValid(validateEmail(value));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate form before submission
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        userType: formData.userType,
        displayName: formData.displayName,
        bio: formData.bio
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-gray-400/30 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-gray-400 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">Loading...</h2>
          <p className="mt-2 text-gray-300">Checking authentication</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-4 px-4">
      <div className="max-w-2xl w-full space-y-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-3">
            Join ARC
          </h1>
          <p className="text-gray-400">
            Create your account and start your gaming journey
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-900/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">Account Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, userType: 'player' })}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center space-x-2 ${
                    formData.userType === 'player'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-gray-600 bg-gray-800 text-gray-400 hover:border-blue-500/50'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-bold text-sm">Player</div>
                    <div className="text-xs opacity-80">Individual gamer</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, userType: 'team' })}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center space-x-2 ${
                    formData.userType === 'team'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-gray-600 bg-gray-800 text-gray-400 hover:border-blue-500/50'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-bold text-sm">Team</div>
                    <div className="text-xs opacity-80">Gaming team</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="username" className="block text-sm font-bold text-white mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    validationErrors.username 
                      ? 'border-red-500 focus:ring-red-500/50' 
                      : 'border-gray-600 focus:ring-blue-500/50 focus:border-blue-500'
                  }`}
                  placeholder="Choose a username"
                />
                {validationErrors.username && (
                  <p className="text-red-400 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {validationErrors.username}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="displayName" className="block text-sm font-bold text-white mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  required
                  className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    validationErrors.displayName 
                      ? 'border-red-500 focus:ring-red-500/50' 
                      : 'border-gray-600 focus:ring-blue-500/50 focus:border-blue-500'
                  }`}
                  placeholder="Your display name"
                />
                {validationErrors.displayName && (
                  <p className="text-red-400 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {validationErrors.displayName}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-white mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`h-4 w-4 ${
                    emailValid === true ? 'text-green-400' : 
                    emailValid === false ? 'text-red-400' : 
                    'text-gray-400'
                  }`} />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full bg-gray-800 border rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    validationErrors.email 
                      ? 'border-red-500 focus:ring-red-500/50' 
                      : emailValid === true
                      ? 'border-green-500 focus:ring-green-500/50'
                      : 'border-gray-600 focus:ring-blue-500/50 focus:border-blue-500'
                  }`}
                  placeholder="Enter your email address"
                />
                {emailValid === true && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  </div>
                )}
              </div>
              {validationErrors.email && (
                <p className="text-red-400 text-xs mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {validationErrors.email}
                </p>
              )}
              {emailValid === true && !validationErrors.email && (
                <p className="text-green-400 text-xs mt-1 flex items-center">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Valid email address
                </p>
              )}
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-bold text-white mb-2">
                Bio (Optional)
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={2}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-white mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className={`w-full bg-gray-800 border rounded-lg px-3 py-2 pr-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                      validationErrors.password 
                        ? 'border-red-500 focus:ring-red-500/50' 
                        : 'border-gray-600 focus:ring-blue-500/50 focus:border-blue-500'
                    }`}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-red-400 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {validationErrors.password}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-white mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className={`w-full bg-gray-800 border rounded-lg px-3 py-2 pr-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                      validationErrors.confirmPassword 
                        ? 'border-red-500 focus:ring-red-500/50' 
                        : 'border-gray-600 focus:ring-blue-500/50 focus:border-blue-500'
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {validationErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;
