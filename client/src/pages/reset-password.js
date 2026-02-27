/**
 * Password Reset Page (with token from email)
 */
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import api from '../lib/api';
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed. Token may be expired.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <Head><title>Reset Password - JZ Waters</title></Head>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          </div>

          {success ? (
            <div className="card text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Password Reset!</h2>
              <p className="text-gray-500 mb-4">Your password has been successfully changed.</p>
              <Link href="/login" className="btn-primary inline-block">Go to Login</Link>
            </div>
          ) : !token ? (
            <div className="card text-center">
              <p className="text-gray-500 mb-4">Invalid or missing reset token.</p>
              <Link href="/forgot-password" className="btn-primary inline-block">Request New Link</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field" required minLength={8} placeholder="Min 8 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input type="password" value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="input-field" required minLength={8} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
              <Link href="/login" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 justify-center">
                <ArrowLeft className="w-3 h-3" /> Back to Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
