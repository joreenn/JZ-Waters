/**
 * Delivery Driver Dashboard
 */
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import StaffLayout from '../components/layout/StaffLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import api from '../lib/api';
import { connectSocket, getSocket } from '../lib/socket';
import { useAuth } from '../contexts/AuthContext';
import { Truck, MapPin, Clock, Package, CheckCircle, XCircle, Phone, Navigation } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../../shared/helpers';
import toast from 'react-hot-toast';

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');

  const fetchDeliveries = useCallback(async () => {
    try {
      const res = await api.get('/deliveries');
      setDeliveries(res.data.deliveries || []);
    } catch { toast.error('Failed to load deliveries'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchDeliveries();
    // Listen for real-time updates
    const socket = getSocket();
    if (socket) {
      socket.on('delivery-assigned', () => {
        toast('New delivery assigned!', { icon: '🚚' });
        fetchDeliveries();
      });
      return () => { socket.off('delivery-assigned'); };
    }
  }, [fetchDeliveries]);

  const updateStatus = async (deliveryId, status) => {
    try {
      await api.put(`/deliveries/${deliveryId}/status`, { status });
      toast.success(`Status updated: ${status.replace('_', ' ')}`);
      fetchDeliveries();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const active = deliveries.filter(d => !['delivered', 'failed'].includes(d.delivery_status));
  const completed = deliveries.filter(d => ['delivered', 'failed'].includes(d.delivery_status));
  const current = tab === 'active' ? active : completed;

  const statusConfig = {
    assigned: { color: 'bg-yellow-100 text-yellow-700', next: 'picked_up', nextLabel: 'Pick Up' },
    picked_up: { color: 'bg-blue-100 text-blue-700', next: 'in_transit', nextLabel: 'Start Delivery' },
    in_transit: { color: 'bg-purple-100 text-purple-700', next: 'delivered', nextLabel: 'Mark Delivered' },
    delivered: { color: 'bg-green-100 text-green-700' },
    failed: { color: 'bg-red-100 text-red-700' },
  };

  return (
    <StaffLayout role="delivery">
      <Head><title>Delivery Dashboard - JZ Waters</title></Head>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Truck className="w-8 h-8 text-primary-600" /> My Deliveries
          </h1>
          <p className="text-gray-500 mt-1">Manage your delivery assignments</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card text-center">
            <p className="text-2xl font-bold text-yellow-600">{active.length}</p>
            <p className="text-sm text-gray-500">Active</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-green-600">{completed.filter(d => d.delivery_status === 'delivered').length}</p>
            <p className="text-sm text-gray-500">Delivered Today</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-red-600">{completed.filter(d => d.delivery_status === 'failed').length}</p>
            <p className="text-sm text-gray-500">Failed</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b">
          <button onClick={() => setTab('active')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'active' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>
            <Package className="w-4 h-4" /> Active ({active.length})
          </button>
          <button onClick={() => setTab('completed')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'completed' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>
            <CheckCircle className="w-4 h-4" /> Completed ({completed.length})
          </button>
        </div>

        {loading ? <LoadingSpinner /> : current.length === 0 ? (
          <EmptyState icon={Truck} title={tab === 'active' ? 'No active deliveries' : 'No completed deliveries'}
            message={tab === 'active' ? 'New assignments will appear here' : ''} />
        ) : (
          <div className="space-y-4">
            {current.map(d => {
              const config = statusConfig[d.delivery_status] || {};
              return (
                <div key={d.id} className="card">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-primary-600">{d.order_number}</h3>
                        <span className={`badge ${config.color}`}>{d.delivery_status?.replace('_', ' ')}</span>
                      </div>

                      <div className="space-y-1.5 text-sm">
                        <p className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{d.customer_name}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{d.delivery_address || 'No address'}</span>
                        </p>
                        {d.customer_phone && (
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <a href={`tel:${d.customer_phone}`} className="text-primary-600 hover:underline">{d.customer_phone}</a>
                          </p>
                        )}
                        {d.zone_name && (
                          <p className="flex items-center gap-2">
                            <Navigation className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-500">Zone: {d.zone_name}</span>
                          </p>
                        )}
                        <p className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-400 text-xs">{formatDateTime(d.assigned_at)}</span>
                        </p>
                      </div>

                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <span className="font-bold text-lg text-primary-600">{formatCurrency(d.total_amount)}</span>
                        <span className="text-gray-400 capitalize">{d.payment_method?.replace('_', ' ')}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {config.next && (
                      <div className="flex flex-col gap-2 min-w-[140px]">
                        <button onClick={() => updateStatus(d.id, config.next)}
                          className="btn-primary text-sm w-full">
                          {config.nextLabel}
                        </button>
                        {d.delivery_status === 'in_transit' && (
                          <button onClick={() => updateStatus(d.id, 'failed')}
                            className="btn-danger text-sm w-full flex items-center justify-center gap-1">
                            <XCircle className="w-4 h-4" /> Failed
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
