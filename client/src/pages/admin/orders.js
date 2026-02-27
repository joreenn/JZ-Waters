/**
 * Admin - Order Management Page
 */
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import api from '../../lib/api';
import { Search, ShoppingBag, Eye, Truck, XCircle, Filter } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../../../shared/helpers';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignOrder, setAssignOrder] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/orders', { params });
      let filtered = res.data.orders || [];
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(o =>
          o.order_number?.toLowerCase().includes(s) ||
          o.customer_name?.toLowerCase().includes(s)
        );
      }
      setOrders(filtered);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const viewOrder = async (orderId) => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setSelectedOrder(res.data.order);
      setDetailOpen(true);
    } catch { toast.error('Failed to load order details'); }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success(`Order ${status}`);
      fetchOrders();
      if (detailOpen) viewOrder(orderId);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  const openAssign = async (order) => {
    setAssignOrder(order);
    try {
      const res = await api.get('/users', { params: { role: 'delivery' } });
      setDrivers(res.data.users.filter(u => u.is_active));
    } catch { /* ignore */ }
    setAssignOpen(true);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await api.post('/deliveries/assign', { order_id: assignOrder.id, driver_id: selectedDriver });
      toast.success('Delivery assigned');
      setAssignOpen(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign');
    }
  };

  return (
    <AdminLayout title="Order Management">
      <Head><title>Orders - Admin - JZ Waters</title></Head>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search order # or customer..." value={search}
            onChange={e => setSearch(e.target.value)} className="input-field pl-9 w-64" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-44">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      {loading ? <LoadingSpinner /> : orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No orders found" message="No orders match your filter criteria" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">Order #</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Total</th>
                <th className="pb-3 font-medium">Payment</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 font-medium text-primary-600">{o.order_number}</td>
                  <td className="py-3">{o.customer_name}</td>
                  <td className="py-3 font-medium">{formatCurrency(o.total_amount)}</td>
                  <td className="py-3">{o.payment_method?.replace('_', ' ')}</td>
                  <td className="py-3"><StatusBadge status={o.status} /></td>
                  <td className="py-3 text-gray-500">{formatDateTime(o.created_at)}</td>
                  <td className="py-3">
                    <div className="flex items-center space-x-1">
                      <button onClick={() => viewOrder(o.id)} className="p-1 text-gray-400 hover:text-primary-600" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      {(o.status === 'pending' || o.status === 'confirmed') && (
                        <button onClick={() => openAssign(o)} className="p-1 text-gray-400 hover:text-blue-600" title="Assign delivery">
                          <Truck className="w-4 h-4" />
                        </button>
                      )}
                      {o.status === 'pending' && (
                        <>
                          <button onClick={() => updateStatus(o.id, 'confirmed')} className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200">Confirm</button>
                          <button onClick={() => updateStatus(o.id, 'cancelled')} className="p-1 text-gray-400 hover:text-red-600" title="Cancel">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title={`Order ${selectedOrder?.order_number || ''}`} size="lg">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Customer:</span> <strong>{selectedOrder.customer_name}</strong></div>
              <div><span className="text-gray-500">Status:</span> <StatusBadge status={selectedOrder.status} /></div>
              <div><span className="text-gray-500">Payment:</span> {selectedOrder.payment_method?.replace('_',' ')}</div>
              <div><span className="text-gray-500">Payment Status:</span> {selectedOrder.payment_status}</div>
              <div className="col-span-2"><span className="text-gray-500">Address:</span> {selectedOrder.delivery_address}</div>
              {selectedOrder.notes && <div className="col-span-2"><span className="text-gray-500">Notes:</span> {selectedOrder.notes}</div>}
            </div>

            <h4 className="font-medium text-gray-900 mt-4">Items</h4>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Product</th><th className="pb-2">Qty</th><th className="pb-2">Price</th><th className="pb-2">Subtotal</th>
              </tr></thead>
              <tbody>
                {selectedOrder.items?.map((it, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2">{it.product_name}</td>
                    <td className="py-2">{it.quantity}</td>
                    <td className="py-2">{formatCurrency(it.unit_price)}</td>
                    <td className="py-2">{formatCurrency(it.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end text-sm space-x-6 pt-2 border-t">
              <span>Delivery Fee: {formatCurrency(selectedOrder.delivery_fee)}</span>
              <span>Discount: {formatCurrency(selectedOrder.discount_amount)}</span>
              <span className="font-bold text-lg">Total: {formatCurrency(selectedOrder.total_amount)}</span>
            </div>

            {/* Status actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              {selectedOrder.status === 'pending' && (
                <>
                  <button onClick={() => { updateStatus(selectedOrder.id, 'confirmed'); }} className="btn-success text-sm">Confirm</button>
                  <button onClick={() => { updateStatus(selectedOrder.id, 'cancelled'); }} className="btn-danger text-sm">Cancel</button>
                </>
              )}
              {selectedOrder.status === 'confirmed' && (
                <button onClick={() => { updateStatus(selectedOrder.id, 'processing'); }} className="btn-primary text-sm">Processing</button>
              )}
              {selectedOrder.status === 'processing' && (
                <button onClick={() => { updateStatus(selectedOrder.id, 'out_for_delivery'); }} className="btn-primary text-sm">Out for Delivery</button>
              )}
              {selectedOrder.status === 'out_for_delivery' && (
                <button onClick={() => { updateStatus(selectedOrder.id, 'delivered'); }} className="btn-success text-sm">Mark Delivered</button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Driver Modal */}
      <Modal isOpen={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Delivery Driver">
        <form onSubmit={handleAssign} className="space-y-4">
          <p className="text-sm text-gray-500">
            Assign a delivery driver for order <strong>{assignOrder?.order_number}</strong>
          </p>
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
