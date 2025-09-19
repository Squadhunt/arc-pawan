import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Gamepad2, Users, Trophy, Zap } from 'lucide-react';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasRedirected, setHasRedirected] = useState(false);
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && !hasRedirected) {
      const from = location.state?.from?.pathname;
      
      // If admin user, always redirect to admin panel (ignore 'from' location)
      if (user.userType === 'admin') {
        setHasRedirected(true);
        navigate('/admin', { replace: true });
      } else {
        setHasRedirected(true);
        navigate(from || '/', { replace: true });
      }
    }
  }, [user, authLoading, navigate, location, hasRedirected]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (loading) {
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const loggedInUser = await login(formData.email, formData.password);
      
      // Check if user is admin and redirect immediately
      if (loggedInUser && loggedInUser.userType === 'admin') {
        setHasRedirected(true);
        navigate('/admin', { replace: true });
      } else {
        setHasRedirected(true);
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
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
    <div className="min-h-screen bg-black flex items-center justify-center px-4">

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-lg mb-4 shadow-lg border border-gray-700">
            <Gamepad2 className="h-8 w-8 text-white" />
          </div>
                              <h2 className="text-3xl font-bold text-white">ARC</h2>
          <p className="text-gray-400 mt-2">Connect with gamers worldwide</p>
        </div>

        {/* Login Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg flex items-center space-x-2">
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-field w-full"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="form-label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input-field w-full pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-primary-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center">
                                  <div className="w-12 h-12 bg-gray-800/20 rounded-lg flex items-center justify-center mx-auto mb-2 border border-gray-700/30">
                        <Users className="h-6 w-6 text-gray-400" />
                      </div>
            <p className="text-xs text-gray-400">Connect</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-800/20 rounded-lg flex items-center justify-center mx-auto mb-2 border border-gray-700/30">
              <Trophy className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-xs text-gray-400">Compete</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-800/20 rounded-lg flex items-center justify-center mx-auto mb-2 border border-gray-700/30">
              <Zap className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-xs text-gray-400">Win</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
