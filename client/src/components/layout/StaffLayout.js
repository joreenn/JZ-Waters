/**
 * Staff Layout - wraps refiller/delivery pages
 */
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from './Navbar';

export default function StaffLayout({ children, allowedRoles = [], role }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const resolvedRoles = allowedRoles.length ? allowedRoles : (role ? [role] : []);

  useEffect(() => {
    if (!loading && (!user || !resolvedRoles.includes(user.role))) {
      router.push('/login');
    }
  }, [user, loading, router, resolvedRoles]);

  if (loading || !user || !resolvedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
