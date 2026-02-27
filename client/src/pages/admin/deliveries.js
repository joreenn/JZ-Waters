/**
 * Admin - Delivery Management Page
 */
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import api from '../../lib/api';
import { Truck, MapPin, User, Clock, Package } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../../../shared/helpers';
import toast from 'react-hot-toast';

export default function AdminDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignOrder, setAssignOrder] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [delRes, unRes, userRes] = await Promise.all([
        api.get('/deliveries'),
        api.get('/deliveries/unassigned'),
        api.get('/users', { params: { role: 'delivery' } })
      ]);
      setDeliveries(delRes.data.deliveries || []);
      setUnassigned(unRes.data.orders || []);
      setDrivers(userRes.data.users?.filter(u => u.is_active) || []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await api.post('/deliveries/assign', { order_id: assignOrder.id, driver_id: selectedDriver });
      toast.success('Delivery assigned');
      setAssignOpen(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const updateDeliveryStatus = async (deliveryId, status) => {
    try {
      await api.put(`/deliveries/${deliveryId}/status`, { status });
      toast.success(`Status updated to ${status.replace('_', ' ')}`);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const statusColors = {
    assigned: 'bg-yellow-100 text-yellow-700',
    picked_up: 'bg-blue-100 text-blue-700',
    in_transit: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700'
  };

  return (
    <AdminLayout title="Deliveries">
      <Head><title>Deliveries - Admin - JZ Waters</title></Head>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        <button onClick={() => setTab('all')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'all' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Truck className="w-4 h-4" /> All Deliveries
        </button>
        <button onClick={() => setTab('unassigned')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'unassigned' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Package className="w-4 h-4" /> Unassigned
          {unassigned.length > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-1.5">{unassigned.length}</span>}
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {/* All Deliveries */}
          {tab === 'all' && (
            deliveries.length === 0 ?
              <EmptyState icon={Truck} title="No deliveries yet" message="Assign orders to delivery drivers to get started" /> :
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-3 font-medium">Order #</th>
                      <th className="pb-3 font-medium">Customer</th>
                      <th className="pb-3 font-medium">Driver</th>
                      <th className="pb-3 font-medium">Zone</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Assigned</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map(d => (
                      <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 font-medium text-primary-600">{d.order_number}</td>
                        <td className="py-3">{d.customer_name}</td>
                        <td className="py-3 flex items-center gap-1"><User className="w-3 h-3 text-gray-400" /> {d.driver_name}</td>
                        <td className="py-3 flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" /> {d.zone_name || '-'}</td>
                        <td className="py-3">
                          <span className={`badge ${statusColors[d.delivery_status] || 'bg-gray-100 text-gray-700'}`}>{d.delivery_status?.replace('_', ' ')}</span>
                        </td>
                        <td className="py-3 text-gray-500 text-xs">{formatDateTime(d.assigned_at)}</td>
                        <td className="py-3">
                          {d.delivery_status === 'assigned' && (
                            <button onClick={() => updateDeliveryStatus(d.id, 'picked_up')} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Pick Up</button>
                          )}
                          {d.delivery_status === 'picked_up' && (
                            <button onClick={() => updateDeliveryStatus(d.id, 'in_transit')} className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded hover:bg-purple-200">In Transit</button>
                          )}
                          {d.delivery_status === 'in_transit' && (
                            <div className="flex gap-1">
                              <button onClick={() => updateDeliveryStatus(d.id, 'delivered')} className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200">Delivered</button>
                              <button onClick={() => updateDeliveryStatus(d.id, 'failed')} className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded hover:bg-red-200">Failed</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          )}

          {/* Unassigned Orders */}
          {tab === 'unassigned' && (
            unassigned.length === 0 ?
              <div className="card text-center py-12">
                <Truck className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900">All orders assigned</h3>
                <p className="text-sm text-gray-500 mt-1">No pending orders waiting for delivery assignment</p>
              </div> :
              <div className="grid gap-4 md:grid-cols-2">
                {unassigned.map(o => (
                  <div key={o.id} className="card">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-primary-600">{o.order_number}</h3>
                        <p className="text-sm text-gray-500">{o.customer_name}</p>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="mt-3 text-sm space-y-1">
                      <p className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" /> {o.delivery_address}</p>
                      <p className="flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" /> {formatDateTime(o.created_at)}</p>
                      <p className="font-medium">{formatCurrency(o.total_amount)}</p>
                    </div>
                    <button
                      onClick={() => { setAssignOrder(o); setSelectedDriver(''); setAssignOpen(true); }}
                      className="btn-primary w-full mt-3 text-sm">
                      Assign Driver
                    </button>
                  </div>
                ))}
              </div>
          )}
        </>
      )}

      {/* Assign Modal */}
      <Modal isOpen={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Delivery Driver">
        <form onSubmit={handleAssign} className="space-y-4">
          <p className="text-sm text-gray-500">
            Assign a driver for <strong>{assignOrder?.order_number}</strong> — {assignOrder?.customer_name}
          </p>
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {assignOrder?.delivery_address}
          </div>
          <select value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)} className="input-field" required>
            <option value="">Select Driver</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setAssignOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Assign</button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
