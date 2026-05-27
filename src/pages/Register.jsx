import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Code2, Mail, Lock, User, Eye, EyeOff, ShoppingBag, Store, AlertCircle, ChevronRight, Loader } from 'lucide-react';
import { apiUrl } from '../config/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'buyer'
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [oauthLoading, setOauthLoading] = useState(null);
  const [oauthStatus, setOauthStatus] = useState({ google: false, github: false });
  const [searchParams] = useSearchParams();

  // Check OAuth status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data } = await axios.get(apiUrl('/api/auth/oauth-status'));
        setOauthStatus(data);
      } catch (_) {}
    };
    fetchStatus();
  }, []);

  // Handle OAuth error from redirect
  useEffect(() => {
    if (searchParams.get('error') === 'oauth_failed') {
      const reason = searchParams.get('reason');
      if (reason) {
        setError(`OAuth login failed: ${decodeURIComponent(reason)}`);
      } else {
        setError('OAuth login failed. Please try again or use email/password.');
      }
    }
  }, [searchParams]);

  const handleOAuthLogin = (provider) => {
    setOauthLoading(provider);
    setError('');
    window.location.href = apiUrl(`/api/auth/${provider}?role=${formData.role}`);
  };

  const googleConfigured = oauthStatus.google?.configured;
  const githubConfigured = oauthStatus.github?.configured;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(apiUrl('/api/auth/register'), formData);
      console.log('Registered successfully:', response.data);
      localStorage.setItem('userInfo', JSON.stringify(response.data));
      if (response.data.role === 'seller') {
        navigate('/seller-dashboard');
      } else {
        navigate('/marketplace');
      }
    } catch (error) {
      if (error.code === 'ERR_NETWORK') {
        setError('Cannot connect to the backend API. Please try again in a moment.');
      } else {
        setError(error.response?.data?.message || 'Server error! Make sure MongoDB is running.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-brand-500/6 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-accent-500/4 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8 md:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              whileHover={{ rotate: 180, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-brand-500/30"
            >
              <Code2 className="text-white" size={28} />
            </motion.div>
            <h2 className="text-2xl font-bold text-light-text mb-1">Create Account</h2>
            <p className="text-light-text-secondary text-sm">Join the DevMarket community</p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-light-text mb-2">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-light-muted" />
                <input
                  type="text"
                  className="input-field pl-10"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-light-text mb-2">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-light-muted" />
                <input
                  type="email"
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-light-text mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-light-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-light-muted hover:text-light-text"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Role Selector */}
            <div>
              <label className="block text-sm font-medium text-light-text mb-3">I want to:</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`cursor-pointer rounded-2xl p-4 flex flex-col items-center gap-2 transition-all border ${formData.role === 'buyer'
                    ? 'bg-brand-50 border-brand-300 text-brand-700 shadow-sm'
                    : 'bg-white border-light-border text-light-text-secondary hover:border-brand-300 hover:text-brand-600'
                  }`}>
                  <input
                    type="radio"
                    name="role"
                    value="buyer"
                    className="hidden"
                    checked={formData.role === 'buyer'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                  <ShoppingBag size={24} className={formData.role === 'buyer' ? 'text-brand-500' : ''} />
                  <span className="text-xs font-medium">Buy Projects</span>
                </label>
                <label className={`cursor-pointer rounded-2xl p-4 flex flex-col items-center gap-2 transition-all border ${formData.role === 'seller'
                    ? 'bg-brand-50 border-brand-300 text-brand-700 shadow-sm'
                    : 'bg-white border-light-border text-light-text-secondary hover:border-brand-300 hover:text-brand-600'
                  }`}>
                  <input
                    type="radio"
                    name="role"
                    value="seller"
                    className="hidden"
                    checked={formData.role === 'seller'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                  <Store size={24} className={formData.role === 'seller' ? 'text-brand-500' : ''} />
                  <span className="text-xs font-medium">Sell Projects</span>
                </label>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-3.5 mt-2 text-base relative overflow-hidden group">
              <span className="relative z-10 flex items-center justify-center gap-2">
                Create Account
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </button>
          </form>

          {/* Social Login */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-light-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-light-muted">or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => handleOAuthLogin('google')}
              disabled={oauthLoading !== null || !googleConfigured}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-light-border text-light-text-secondary hover:text-light-text hover:border-brand-300 transition-all text-sm disabled:opacity-50 disabled:cursor-wait"
            >
              {oauthLoading === 'google' ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
              )}
              {oauthLoading === 'google' ? 'Redirecting...' : 'Google'}
            </button>
            <button
              onClick={() => handleOAuthLogin('github')}
              disabled={oauthLoading !== null || !githubConfigured}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-light-border text-light-text-secondary hover:text-light-text hover:border-brand-300 transition-all text-sm disabled:opacity-50 disabled:cursor-wait"
            >
              {oauthLoading === 'github' ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              )}
              {oauthLoading === 'github' ? 'Redirecting...' : 'GitHub'}
            </button>
          </div>

          {(!googleConfigured || !githubConfigured) && (
            <div className="text-center mb-6">
              <p className="text-xs text-light-muted bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Social login is available after configuring provider keys in the backend environment.
              </p>
            </div>
          )}

          <div className="text-center text-sm text-light-text-secondary">
            Already have an account? <Link to="/login" className="text-brand-600 hover:text-brand-500 font-medium transition-colors">Sign in</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
