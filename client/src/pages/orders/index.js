/**
 * Customer Orders Page
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { ShoppingBag, Eye, Clock } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../../../shared/helpers';
import toast from 'react-hot-toast';

export default function Orders() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders');
        setOrders(res.data.orders || []);
      } catch { toast.error('Failed to load orders'); }
      finally { setLoading(false); }
    };
    fetchOrders();
  }, [user, router]);

  if (!user) return null;

  return (
    <>
      <Head><title>My Orders - JZ Waters</title></Head>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

          {loading ? <LoadingSpinner /> : orders.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="No orders yet" message="Place your first order to see it here"
              action={<Link href="/products" className="btn-primary mt-4 inline-block">Browse Products</Link>} />
          ) : (
            <div className="space-y-4">
              {orders.map(o => (
                <Link key={o.id} href={`/orders/${o.id}`}>
                  <div className="card hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-primary-600">{o.order_number}</h3>
                          <StatusBadge status={o.status} />
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" /> {formatDateTime(o.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary-600">{formatCurrency(o.total_amount)}</p>
                        <p className="text-xs text-gray-400 capitalize">{o.payment_method?.replace('_', ' ')}</p>
                      </div>
                    </div>
                    {o.delivery_address && (
                      <p className="text-sm text-gray-500 mt-2 truncate">{o.delivery_address}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
