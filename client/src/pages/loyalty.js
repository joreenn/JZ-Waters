/**
 * Customer - Loyalty Points Page
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/layout/Navbar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { Gift, Star, ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../../shared/helpers';
import toast from 'react-hot-toast';

export default function Loyalty() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bRes, hRes] = await Promise.all([
          api.get('/loyalty/balance'),
          api.get('/loyalty/history')
        ]);
        setBalance(bRes.data);
        setHistory(hRes.data.history || []);
      } catch { toast.error('Failed to load loyalty data'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  return (
    <>
      <Head><title>Loyalty Points - JZ Waters</title></Head>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Loyalty Points</h1>

          {loading ? <LoadingSpinner /> : (
            <>
              {/* Balance Card */}
              <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-2xl text-white p-8 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">Available Points</p>
                    <p className="text-4xl font-bold">{balance?.balance || 0}</p>
                  </div>
                </div>
                <div className="flex gap-6 text-sm text-white/80">
                  <div>
                    <p>Cash Value</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(balance?.peso_value || 0)}</p>
                  </div>
                  <div>
                    <p>Total Earned</p>
                    <p className="text-lg font-bold text-white">{balance?.total_earned || 0} pts</p>
                  </div>
                  <div>
                    <p>Total Redeemed</p>
                    <p className="text-lg font-bold text-white">{balance?.total_redeemed || 0} pts</p>
                  </div>
                </div>
              </div>

              {/* How it works */}
              <div className="card mb-8">
                <h3 className="font-semibold text-gray-900 mb-3">How It Works</h3>
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium">Earn Points</p>
                      <p className="text-gray-500">Earn 1 point per ₱10 spent on delivered orders</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Gift className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium">Redeem</p>
                      <p className="text-gray-500">Use points as discount at checkout</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium">Value</p>
                      <p className="text-gray-500">Each point is worth ₱0.10</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* History */}
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-4">Points History</h3>
                {history.length === 0 ? (
                  <EmptyState icon={Gift} title="No points history" message="Start ordering to earn loyalty points!" />
                ) : (
                  <div className="space-y-3">
                    {history.map(h => (
                      <div key={h.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${h.points > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                            {h.points > 0 ? <ArrowUp className="w-4 h-4 text-green-600" /> : <ArrowDown className="w-4 h-4 text-red-600" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{h.description}</p>
                            <p className="text-xs text-gray-400">{formatDateTime(h.created_at)}</p>
                          </div>
                        </div>
                        <span className={`font-bold ${h.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {h.points > 0 ? '+' : ''}{h.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
