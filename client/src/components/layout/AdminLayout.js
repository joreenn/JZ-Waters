/**
 * Admin Layout - wraps admin pages with sidebar + topbar
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import AdminSidebar from './AdminSidebar';
import { Menu, Bell, LogOut, User } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children, title }) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">{title || 'Dashboard'}</h1>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/admin/notifications" className="relative p-2 text-gray-500 hover:text-primary-600">
              <Bell className="w-5 h-5" />
            </Link>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <span className="hidden sm:block">{user.name}</span>
            </div>
            <button onClick={() => { logout(); router.push('/login'); }} className="p-2 text-gray-500 hover:text-red-600">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
