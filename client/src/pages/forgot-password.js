/**
 * Forgot Password Page
 */
import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import api from '../lib/api';
import { Droplets, Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset link sent if email exists');
    } catch (err) {
      toast.error('Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Forgot Password - JZ Waters</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Droplets className="w-10 h-10 text-white mx-auto" />
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {sent ? (
              <div className="text-center">
                <Mail className="w-16 h-16 text-primary-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
                <p className="text-gray-500 mb-6">If an account exists with that email, we&apos;ve sent a password reset link.</p>
                <Link href="/login" className="btn-primary inline-block">Back to Login</Link>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Forgot Password?</h2>
                <p className="text-center text-gray-500 text-sm mb-6">Enter your email and we&apos;ll send you a reset link.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        className="input-field pl-10" required />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>

                <Link href="/login" className="flex items-center justify-center mt-4 text-sm text-primary-600 hover:text-primary-500">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
