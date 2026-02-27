/**
 * Registration Page
 */
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '../contexts/AuthContext';
import { Droplets, Mail, Lock, User, Phone, MapPin, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', address: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (form.password.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, phone: form.phone, address: form.address });
      toast.success('Account created successfully!');
      router.push('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Register - JZ Waters</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 text-white">
              <Droplets className="w-10 h-10" />
              <span className="text-3xl font-bold">JZ Waters</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Create Account</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input type="text" name="name" value={form.name} onChange={handleChange}
                    placeholder="Juan Dela Cruz" className="input-field pl-10" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder="you@example.com" className="input-field pl-10" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                      placeholder="Min 8 chars" className="input-field pl-10" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                      placeholder="Repeat" className="input-field pl-10" required />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                    placeholder="09XX XXX XXXX" className="input-field pl-10" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input type="text" name="address" value={form.address} onChange={handleChange}
                    placeholder="House #, Street, Barangay" className="input-field pl-10" />
                </div>
              </div>

              <label className="flex items-start text-sm text-gray-600 mt-2">
                <input type="checkbox" className="rounded border-gray-300 text-primary-600 mt-0.5 mr-2" required />
                I agree to the Terms of Service and Privacy Policy
              </label>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-primary-600 font-medium hover:text-primary-500">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
