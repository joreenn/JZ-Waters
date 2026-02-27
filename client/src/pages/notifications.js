/**
 * Customer - Notifications Page
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/layout/Navbar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { Bell, Check, CheckCheck, Circle } from 'lucide-react';
import { formatDateTime } from '../../../shared/helpers';
import toast from 'react-hot-toast';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* */ }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All marked as read');
    } catch { /* */ }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      <Head><title>Notifications - JZ Waters</title></Head>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500 mt-1">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="btn-secondary text-sm flex items-center gap-1">
                <CheckCheck className="w-4 h-4" /> Mark All Read
              </button>
            )}
          </div>

          {loading ? <LoadingSpinner /> : notifications.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications" message="You're all caught up!" />
          ) : (
            <div className="space-y-2">
              {notifications.map(n => (
                <div key={n.id}
                  className={`card cursor-pointer transition-colors ${!n.is_read ? 'bg-primary-50 border-l-4 border-l-primary-400' : 'hover:bg-gray-50'}`}
                  onClick={() => !n.is_read && markRead(n.id)}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${!n.is_read ? 'bg-primary-100' : 'bg-gray-100'}`}>
                      {!n.is_read ? <Circle className="w-3 h-3 fill-primary-600 text-primary-600" /> : <Check className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{n.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
