import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, ShoppingCart, User, LogOut, Menu, X, LayoutDashboard, Store } from 'lucide-react';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: '/marketplace', label: 'Marketplace', icon: Store },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className={`fixed w-full z-50 h-20 flex items-center transition-all duration-500 ${scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-light-border shadow-sm'
          : 'bg-transparent'
        }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <motion.div
            whileHover={{ rotate: 180, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30"
          >
            <Code2 className="text-white" size={22} />
          </motion.div>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-light-text">Dev</span>
            <span className="gradient-text">Market</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(link.to)
                  ? 'text-brand-700 bg-brand-50'
                  : 'text-light-text-secondary hover:text-light-text hover:bg-light-surface'
                }`}
            >
              {isActive(link.to) && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 bg-brand-50 rounded-lg"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <link.icon size={15} />
                {link.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {userInfo ? (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 rounded-lg border border-brand-200"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {userInfo.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-light-text font-medium">{userInfo.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-brand-700 bg-brand-100 px-1.5 py-0.5 rounded">
                  {userInfo.role}
                </span>
              </motion.div>

              {userInfo.role === 'seller' && (
                <Link
                  to="/seller-dashboard"
                  className={`btn-ghost flex items-center gap-1.5 text-sm ${isActive('/seller-dashboard') ? 'text-brand-600' : ''
                    }`}
                >
                  <LayoutDashboard size={15} />
                  Dashboard
                </Link>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium transition-all duration-200 border border-red-200"
              >
                <LogOut size={15} />
                Logout
              </motion.button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm">Log In</Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-5">Sign Up Free</Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-light-text-secondary hover:text-light-text hover:bg-light-surface transition-all"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="absolute top-20 left-0 right-0 bg-white/95 backdrop-blur-2xl border-b border-light-border overflow-hidden md:hidden shadow-lg"
          >
            <div className="px-6 py-6 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${isActive(link.to)
                      ? 'bg-brand-50 text-brand-700 border border-brand-200'
                      : 'text-light-text-secondary hover:text-light-text hover:bg-light-surface'
                    }`}
                >
                  <link.icon size={18} />
                  {link.label}
                </Link>
              ))}

              <div className="border-t border-light-border pt-3">
                {userInfo ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                        <span className="text-base font-bold text-white">
                          {userInfo.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-light-text">{userInfo.name}</p>
                        <p className="text-xs text-light-text-secondary capitalize">{userInfo.role}</p>
                      </div>
                    </div>
                    {userInfo.role === 'seller' && (
                      <Link
                        to="/seller-dashboard"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-light-text-secondary hover:text-light-text hover:bg-light-surface transition-all"
                      >
                        <LayoutDashboard size={18} />
                        Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="space-y-2 pt-2">
                    <Link
                      to="/login"
                      className="block text-center px-4 py-3 rounded-xl bg-white border border-light-border text-light-text-secondary hover:text-light-text transition-all"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/register"
                      className="block text-center px-4 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-medium hover:from-brand-500 hover:to-brand-400 transition-all"
                    >
                      Sign Up Free
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
