import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import LoyaltyCard from '../components/LoyaltyCard';
import OrderCard from '../components/OrderCard';
import { getMyPoints } from '../api/loyalty';
import { getMyOrders } from '../api/orders';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [loyalty, setLoyalty] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyPoints(), getMyOrders()])
      .then(([pts, ords]) => {
        setLoyalty(pts);
        setOrders(ords);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-sky py-16 relative overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bubble" />
        ))}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto text-3xl font-bold text-white border-4 border-white/40"
          >
            {user?.full_name?.[0] || 'U'}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-heading text-2xl sm:text-3xl font-extrabold text-white mt-4"
          >
            {user?.full_name || 'User'}
          </motion.h1>
          <p className="text-primary-100 text-sm mt-1">{user?.email}</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: user info + loyalty */}
          <div className="space-y-6">
            {/* User info card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl border border-gray-100 p-6"
            >
              <h3 className="font-heading text-lg font-bold text-darkText mb-4">My Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-400">Name</span>
                  <p className="font-semibold text-darkText">{user?.full_name}</p>
                </div>
                <div>
                  <span className="text-gray-400">Email</span>
                  <p className="font-semibold text-darkText">{user?.email}</p>
                </div>
                <div>
                  <span className="text-gray-400">Phone</span>
                  <p className="font-semibold text-darkText">{user?.phone || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Address</span>
                  <p className="font-semibold text-darkText">{user?.address || '—'}</p>
                </div>
              </div>
            </motion.div>

            {/* Loyalty card */}
            {loyalty && (
              <LoyaltyCard
                points={loyalty.points}
                nextTier={loyalty.next_tier_points}
                tier={loyalty.tier}
                perks={loyalty.perks}
              />
            )}
          </div>

          {/* Right: order history */}
          <div className="lg:col-span-2">
            <h3 className="font-heading text-lg font-bold text-darkText mb-4">Order History</h3>
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-5xl block mb-3">📦</span>
                <p className="text-gray-500">No orders yet.</p>
                <Link to="/products" className="mt-3 inline-block text-primary-600 font-bold hover:underline">
                  Start Shopping →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((o) => (
                  <Link key={o.id} to={`/orders/${o.id}`}>
                    <OrderCard order={o} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
