/**
 * Customer - Loyalty Progress Page
 */
import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/layout/Navbar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import api from '../lib/api';
import { Gift, Star, Trophy, Clock4 } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../../shared/helpers';
import toast from 'react-hot-toast';

export default function Loyalty() {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progressWidth, setProgressWidth] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balanceRes, historyRes, ordersRes] = await Promise.all([
          api.get('/loyalty/balance'),
          api.get('/loyalty/history'),
          api.get('/orders', { params: { limit: 8 } }),
        ]);

        setSummary(balanceRes.data || null);
        setHistory(historyRes.data.history || []);
        setOrders((ordersRes.data.orders || []).slice(0, 6));
      } catch {
        toast.error('Failed to load loyalty data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!summary) return;
    const timer = setTimeout(() => {
      const target = Number(summary.progress_percent || 0);
      setProgressWidth(Math.max(0, Math.min(100, target)));
    }, 120);

    return () => clearTimeout(timer);
  }, [summary]);

  const gallonsToNextReward = useMemo(() => {
    if (!summary) return 0;
    return Math.max(0, Number(summary.pesos_to_next_reward || 0));
  }, [summary]);

  return (
    <>
      <Head><title>Loyalty Progress - JZ Waters</title></Head>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Loyalty Progress</h1>
          <p className="text-gray-500 mb-8">Every {formatCurrency(summary?.pesos_per_percent || 150)} in purchases = 1%. Reach 100% to earn 1 free gallon.</p>

          {loading ? <LoadingSpinner /> : (
            <>
              <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-2xl text-white p-6 md:p-8 mb-8 shadow-lg">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <p className="text-white/90 font-medium">Free Gallon Reward Meter</p>
                    </div>

                    <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${progressWidth}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-white/80 mt-2">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>

                    <div className="mt-4 text-sm text-white/90">
                      <p>
                        Current progress: <span className="font-bold text-white">{Number(summary?.progress_percent || 0)}%</span>
                        {' '}({formatCurrency(summary?.pesos_in_current_cycle || 0)} / {formatCurrency(summary?.pesos_for_one_reward || 15000)})
                      </p>
                      <p className="mt-1">
                        {gallonsToNextReward === 0
                          ? 'Reward unlocked. You earned 1 free gallon!'
                          : `${formatCurrency(gallonsToNextReward)} more purchases needed for a free gallon.`}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-white/80 text-sm">Free Gallons Earned</p>
                    <p className="text-3xl font-bold mt-1">{summary?.free_gallons_earned || 0}</p>
                    <div className="mt-4 text-xs space-y-1 text-white/80">
                      <p>Total Purchases: {formatCurrency(summary?.total_purchase_amount || 0)}</p>
                      <p>Total Orders: {summary?.total_purchase_count || 0}</p>
                      <p>Delivered Orders: {summary?.delivered_orders || 0}</p>
                      <p>Cancelled Orders: {summary?.cancelled_orders || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Connected Purchase History</h3>
                  <Link href="/orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View Purchase History</Link>
                </div>

                {orders.length === 0 ? (
                  <EmptyState icon={Clock4} title="No purchases yet" message="Delivered and cancelled purchases appear here." />
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-gray-100 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="font-medium text-gray-900">{order.order_number || `Order #${order.id}`}</p>
                          <p className="text-xs text-gray-500">{formatDateTime(order.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={order.status} />
                          <span className="font-semibold text-primary-600">{formatCurrency(order.total_amount || 0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="card lg:col-span-1">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary-600" /> Points Wallet
                  </h3>
                  <p className="text-sm text-gray-500">Available Points</p>
                  <p className="text-3xl font-bold text-primary-600 mt-1">{summary?.points_balance || 0}</p>
                  <p className="text-sm text-gray-500 mt-2">Cash Value: {formatCurrency(summary?.peso_value || 0)}</p>
                </div>

                <div className="card lg:col-span-2">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-primary-600" /> Points Activity
                  </h3>
                  {history.length === 0 ? (
                    <EmptyState icon={Gift} title="No points activity" message="Points updates appear here after order status updates." />
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-auto pr-1">
                      {history.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{entry.description || 'Loyalty update'}</p>
                            <p className="text-xs text-gray-400">{formatDateTime(entry.created_at)}</p>
                          </div>
                          <div className={`text-sm font-bold ${Number(entry.points) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Number(entry.points) >= 0 ? '+' : ''}{entry.points}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
