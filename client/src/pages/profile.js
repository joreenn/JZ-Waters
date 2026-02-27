/**
 * Customer Profile Page
 */
import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { User, Lock, Save, Mail, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [saving, setSaving] = useState(false);

  if (!user) {
    if (typeof window !== 'undefined') router.push('/login');
    return null;
  }

  const handleProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', form);
      updateUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pw.new_password !== pw.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await api.put('/auth/change-password', {
        current_password: pw.current_password,
        new_password: pw.new_password
      });
      toast.success('Password changed');
      setPw({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <Head><title>Profile - JZ Waters</title></Head>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b">
            <button onClick={() => setTab('profile')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'profile' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <User className="w-4 h-4" /> Profile
            </button>
            <button onClick={() => setTab('password')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'password' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Lock className="w-4 h-4" /> Password
            </button>
          </div>

          {tab === 'profile' ? (
            <form onSubmit={handleProfile} className="card space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Mail className="w-4 h-4 text-gray-400" /> Email
                </label>
                <input type="email" value={user.email} disabled className="input-field bg-gray-50 text-gray-500" />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <User className="w-4 h-4 text-gray-400" /> Full Name
                </label>
                <input type="text" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Phone className="w-4 h-4 text-gray-400" /> Phone
                </label>
                <input type="tel" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-400" /> Address
                </label>
                <textarea value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="input-field" rows="3" placeholder="Your delivery address" />
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePassword} className="card space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input type="password" value={pw.current_password}
                  onChange={e => setPw({ ...pw, current_password: e.target.value })}
                  className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" value={pw.new_password}
                  onChange={e => setPw({ ...pw, new_password: e.target.value })}
                  className="input-field" required minLength={8} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input type="password" value={pw.confirm_password}
                  onChange={e => setPw({ ...pw, confirm_password: e.target.value })}
                  className="input-field" required minLength={8} />
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                  <Lock className="w-4 h-4" /> {saving ? 'Saving...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
