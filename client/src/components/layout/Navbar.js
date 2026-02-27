/**
 * Navbar component - public/customer navigation
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import api from '../../lib/api';
import {
  Droplets, ShoppingCart, Bell, Menu, X, User, LogOut,
  LayoutDashboard, Package, Clock, Star, ChevronDown
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      api.get('/notifications/unread-count').then(res => setUnreadCount(res.data.count)).catch(() => {});
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Get dashboard link based on role
  const getDashboardLink = () => {
    switch (user?.role) {
      case 'admin': return '/admin';
      case 'refiller': return '/refiller';
      case 'delivery': return '/delivery';
      default: return '/orders';
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Droplets className="w-8 h-8 text-primary-600" />
            <span className="text-xl font-bold text-primary-800">JZ Waters</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className={`text-sm font-medium ${router.pathname === '/' ? 'text-primary-600' : 'text-gray-600 hover:text-primary-600'}`}>
              Home
            </Link>
            <Link href="/products" className={`text-sm font-medium ${router.pathname === '/products' ? 'text-primary-600' : 'text-gray-600 hover:text-primary-600'}`}>
              Products
            </Link>
            {user && (
              <Link href={getDashboardLink()} className="text-sm font-medium text-gray-600 hover:text-primary-600">
                Dashboard
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {/* Cart */}
            <Link href="/cart" className="relative p-2 text-gray-600 hover:text-primary-600">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {totalItems}
                </span>
              )}
            </Link>

            {user ? (
              <>
                {/* Notifications */}
                <Link href="/notifications" className="relative p-2 text-gray-600 hover:text-primary-600">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center space-x-2 text-sm text-gray-700 hover:text-primary-600"
                  >
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-600" />
                    </div>
                    <span className="hidden sm:block font-medium">{user.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <p className="text-xs text-primary-600 capitalize mt-1">{user.role}</p>
                      </div>
                      <Link href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>
                        <User className="w-4 h-4 mr-2" /> Profile
                      </Link>
                      {user.role === 'customer' && (
                        <>
                          <Link href="/orders" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>
                            <Package className="w-4 h-4 mr-2" /> My Orders
                          </Link>
                          <Link href="/subscriptions" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>
                            <Clock className="w-4 h-4 mr-2" /> Subscriptions
                          </Link>
                          <Link href="/loyalty" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>
                            <Star className="w-4 h-4 mr-2" /> Loyalty Points
                          </Link>
                        </>
                      )}
                      {user.role !== 'customer' && (
                        <Link href={getDashboardLink()} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>
                          <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                        </Link>
                      )}
                      <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        <LogOut className="w-4 h-4 mr-2" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-primary-600 px-3 py-2">
                  Sign In
                </Link>
                <Link href="/register" className="btn-primary text-sm">
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-600">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            <Link href="/" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded" onClick={() => setMobileOpen(false)}>Home</Link>
            <Link href="/products" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded" onClick={() => setMobileOpen(false)}>Products</Link>
            {user && (
              <Link href={getDashboardLink()} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded" onClick={() => setMobileOpen(false)}>Dashboard</Link>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close profile */}
      {profileOpen && <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />}
    </nav>
  );
}
