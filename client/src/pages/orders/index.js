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
import { ShoppingBag, Clock, Wallet } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../../../shared/helpers';
import toast from 'react-hot-toast';

export default function Orders() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const totalPurchaseAmount = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

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
      <Head><title>Purchase History - JZ Waters</title></Head>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase History</h1>
          <p className="text-gray-500 mb-8">Track all your purchases with date and time, amount paid, payment type, and status.</p>

          {!loading && orders.length > 0 && (
            <div className="card mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">Total Purchases</p>
                  <p className="text-2xl font-bold text-primary-600">{formatCurrency(totalPurchaseAmount)}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {orders.length} order{orders.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )}

          {loading ? <LoadingSpinner /> : orders.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="No purchases yet" message="Your delivered or cancelled orders will appear here."
              action={<Link href="/products" className="btn-primary mt-4 inline-block">Browse Products</Link>} />
          ) : (
            <div className="space-y-4">
              {orders.map(o => (
                <Link key={o.id} href={`/orders/${o.id}`}>
                  <div className="card hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-primary-600">{o.order_number || `Order #${o.id}`}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Date & Time: {formatDateTime(o.created_at)}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Wallet className="w-3 h-3" /> Payment Type: <span className="capitalize">{o.payment_method?.replace('_', ' ') || 'N/A'}</span>
                        </p>
                      </div>

                      <div className="text-left sm:text-right space-y-1">
                        <StatusBadge status={o.status} />
                        <p className="text-lg font-bold text-primary-600">{formatCurrency(o.total_amount)}</p>
                        <p className="text-xs text-gray-500">Amount Paid</p>
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
