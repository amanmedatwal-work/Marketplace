import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader, CheckCircle2, AlertCircle } from 'lucide-react';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const data = searchParams.get('data');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setTimeout(() => navigate('/login?error=oauth_failed'), 2000);
      return;
    }

    if (data) {
      try {
        const userData = JSON.parse(decodeURIComponent(data));
        localStorage.setItem('userInfo', JSON.stringify(userData));
        setStatus('success');
        const timer = setTimeout(() => {
          const redirectRole = userData.intent || userData.role;
          if (redirectRole === 'seller') {
            navigate('/seller-dashboard');
          } else {
            navigate('/marketplace');
          }
        }, 1000);
        return () => clearTimeout(timer);
      } catch (err) {
        setStatus('error');
        setTimeout(() => navigate('/login?error=oauth_failed'), 2000);
      }
    } else {
      setStatus('error');
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        {status === 'processing' && (
          <div className="flex flex-col items-center gap-4">
            <Loader size={40} className="text-brand-500 animate-spin" />
            <p className="text-light-text font-medium">Completing sign in...</p>
          </div>
        )}
        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center">
              <CheckCircle2 size={36} className="text-green-500" />
            </div>
            <p className="text-light-text font-medium">Signed in successfully!</p>
            <p className="text-sm text-light-text-secondary">Redirecting...</p>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
              <AlertCircle size={36} className="text-red-500" />
            </div>
            <p className="text-light-text font-medium">Sign in failed</p>
            <p className="text-sm text-light-text-secondary">Redirecting to login page...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AuthCallback;
