import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import StepTracker from '../components/StepTracker';
import { trackOrder, getMyOrders } from '../api/orders';

export default function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      trackOrder(id)
        .then(setOrder)
        .finally(() => setLoading(false));
    } else {
      getMyOrders()
        .then(setOrders)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  // ── Order list view (no id param) ──
  if (!id) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-sky py-12 relative overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bubble" />
          ))}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-heading text-3xl sm:text-4xl font-extrabold text-white"
            >
              My Orders
            </motion.h1>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-6xl block mb-4">📦</span>
              <p className="text-gray-500">No orders yet.</p>
              <Link to="/products" className="mt-4 inline-block text-primary-600 font-bold hover:underline">
                Start Shopping →
              </Link>
            </div>
          ) : (
            orders.map((o) => {
              const statusColors = {
                pending: 'bg-yellow-100 text-yellow-800',
                confirmed: 'bg-blue-100 text-blue-800',
                out_for_delivery: 'bg-purple-100 text-purple-800',
                delivered: 'bg-emerald-100 text-emerald-800',
                cancelled: 'bg-red-100 text-red-800',
              };
              const statusLabel = {
                pending: 'Pending',
                confirmed: 'Confirmed',
                out_for_delivery: 'Out for Delivery',
                delivered: 'Delivered',
                cancelled: 'Cancelled',
              };
              return (
                <Link key={o.id} to={`/orders/${o.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -2 }}
                    className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:shadow-md transition-shadow"
                  >
                    <div>
                      <p className="font-heading text-lg font-bold text-darkText">Order #{o.id}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(o.created_at).toLocaleDateString('en-PH', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-heading font-bold text-primary-600">₱{o.total}</span>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusColors[o.status] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabel[o.status] || o.status}
                      </span>
                    </div>
                  </motion.div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ── Single order tracking view ──
  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Order not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-sky py-12 relative overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bubble" />
        ))}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-3xl sm:text-4xl font-extrabold text-white"
          >
            Order #{order.id}
          </motion.h1>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Step tracker */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl border border-gray-100 p-6"
          >
            <h3 className="font-heading text-lg font-bold text-darkText mb-6">Order Status</h3>
            <StepTracker currentStatus={order.status} />
          </motion.div>

          {/* Right: info */}
          <div className="space-y-6">
            {/* Rider card */}
            {order.rider && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl border border-gray-100 p-6"
              >
                <h3 className="font-heading text-lg font-bold text-darkText mb-3">Your Rider</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-xl">
                    🚴
                  </div>
                  <div>
                    <p className="font-semibold text-darkText">{order.rider.name}</p>
                    <p className="text-sm text-gray-500">{order.rider.phone}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Items summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-gray-100 p-6"
            >
              <h3 className="font-heading text-lg font-bold text-darkText mb-3">Items</h3>
              <div className="divide-y divide-gray-50">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between py-2 text-sm">
                    <span className="text-gray-700">{item.name} × {item.quantity}</span>
                    <span className="font-semibold text-darkText">₱{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
                <span className="text-gray-500">Delivery Fee</span>
                <span className="font-semibold">₱{order.delivery_fee || 0}</span>
              </div>
              <div className="flex justify-between mt-2 pt-3 border-t border-gray-100">
                <span className="font-semibold text-darkText">Total</span>
                <span className="font-heading text-xl font-bold text-primary-600">₱{order.total}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
