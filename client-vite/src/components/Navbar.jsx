import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { cartCount } = useCart();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Products', to: '/products' },
    { label: 'Orders', to: '/orders' },
    { label: 'Loyalty', to: '/profile' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-lg shadow-lg'
            : 'bg-white/70 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-3xl">💧</span>
            <span className="font-heading text-xl font-bold text-primary-600">
              JZ Waters
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-semibold transition-colors hover:text-primary-600 ${
                  location.pathname === link.to
                    ? 'text-primary-600'
                    : 'text-darkText'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side: cart, bell, user */}
          <div className="flex items-center gap-4">
            {/* Cart icon */}
            <Link to="/cart" className="relative p-2 hover:bg-primary-50 rounded-full transition-colors">
              <svg className="w-6 h-6 text-darkText" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-coral text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full"
                >
                  {cartCount}
                </motion.span>
              )}
            </Link>

            {/* Notification bell */}
            <button className="relative p-2 hover:bg-primary-50 rounded-full transition-colors hidden sm:block">
              <svg className="w-6 h-6 text-darkText" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-coral rounded-full" />
            </button>

            {/* User avatar / Login */}
            {user ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-primary-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold">
                    {user.full_name?.[0] || user.email?.[0] || 'U'}
                  </div>
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50"
                    >
                      <Link to="/profile" className="block px-4 py-2 text-sm text-darkText hover:bg-primary-50">
                        My Profile
                      </Link>
                      <Link to="/orders" className="block px-4 py-2 text-sm text-darkText hover:bg-primary-50">
                        My Orders
                      </Link>
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-coral hover:bg-red-50"
                      >
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:inline-flex items-center gap-1 bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden p-2 hover:bg-primary-50 rounded-lg"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6 text-darkText" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/40 z-50 md:hidden"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 shadow-2xl md:hidden flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <Link to="/" className="flex items-center gap-2">
                  <span className="text-2xl">💧</span>
                  <span className="font-heading text-lg font-bold text-primary-600">JZ Waters</span>
                </Link>
                <button onClick={() => setMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* User info in drawer */}
              {user && (
                <div className="p-4 border-b border-gray-100 bg-primary-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
                      {user.full_name?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-darkText">{user.full_name || 'User'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Links */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`block px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                      location.pathname === link.to
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-darkText hover:bg-primary-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  to="/cart"
                  className="block px-4 py-3 rounded-lg text-sm font-semibold text-darkText hover:bg-primary-50"
                >
                  Cart {cartCount > 0 && `(${cartCount})`}
                </Link>
              </nav>

              {/* Bottom action */}
              <div className="p-4 border-t border-gray-100">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full py-3 rounded-lg bg-coral text-white font-semibold text-sm hover:bg-orange-600 transition-colors"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="block text-center w-full py-3 rounded-lg bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-colors"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for fixed nav */}
      <div className="h-16" />
    </>
  );
}
