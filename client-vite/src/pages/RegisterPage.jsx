import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    address: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await register({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        address: form.address,
        phone: form.phone,
      });
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'full_name', label: 'Full Name', type: 'text', placeholder: 'Juan Dela Cruz' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
    { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
    { key: 'confirm_password', label: 'Confirm Password', type: 'password', placeholder: '••••••••' },
    { key: 'address', label: 'Address', type: 'text', placeholder: '123 Main St, Barangay' },
    { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '09171234567' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 sm:p-10"
      >
        <div className="text-center mb-8">
          <span className="text-5xl block mb-3">💧</span>
          <h1 className="font-heading text-2xl font-bold text-darkText">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join JZ Waters and start ordering</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-5">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-semibold text-darkText mb-1">{f.label}</label>
              <input
                type={f.type}
                required
                value={form[f.key]}
                onChange={set(f.key)}
                placeholder={f.placeholder}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 min-h-[44px]"
              />
            </div>
          ))}

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 min-h-[44px]"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </motion.button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
