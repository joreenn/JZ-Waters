/**
 * Admin - Delivery Zones Page
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import api from '../../lib/api';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../../../shared/helpers';
import toast from 'react-hot-toast';

export default function AdminZones() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editZone, setEditZone] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', delivery_fee: '', min_order_amount: 0, is_active: true });

  useEffect(() => { fetchZones(); }, []);

  const fetchZones = async () => {
    try {
      const res = await api.get('/zones');
      setZones(res.data.zones);
    } catch { toast.error('Failed to load zones'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form, delivery_fee: parseFloat(form.delivery_fee), min_order_amount: parseFloat(form.min_order_amount) || 0 };
      if (editZone) {
        await api.put(`/zones/${editZone.id}`, data);
        toast.success('Zone updated');
      } else {
        await api.post('/zones', data);
        toast.success('Zone created');
      }
      setModalOpen(false);
      setEditZone(null);
      fetchZones();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const deleteZone = async (id) => {
    if (!confirm('Delete this zone?')) return;
    try {
      await api.delete(`/zones/${id}`);
      toast.success('Zone deleted');
      fetchZones();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const openCreate = () => {
    setEditZone(null);
    setForm({ name: '', description: '', delivery_fee: '', min_order_amount: 0, is_active: true });
    setModalOpen(true);
  };

  const openEdit = (z) => {
    setEditZone(z);
    setForm({ name: z.name, description: z.description || '', delivery_fee: z.delivery_fee, min_order_amount: z.min_order_amount || 0, is_active: z.is_active });
    setModalOpen(true);
  };

  return (
    <AdminLayout title="Delivery Zones">
      <Head><title>Zones - Admin - JZ Waters</title></Head>

      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500 text-sm">{zones.length} zone{zones.length !== 1 ? 's' : ''} configured</p>
        <button onClick={openCreate} className="btn-primary flex items-center space-x-2">
          <Plus className="w-4 h-4" /> <span>Add Zone</span>
        </button>
      </div>

      {loading ? <LoadingSpinner /> : zones.length === 0 ? (
        <EmptyState icon={MapPin} title="No zones" message="Add delivery zones to set up area-based delivery fees" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {zones.map(z => (
            <div key={z.id} className={`card border-l-4 ${z.is_active ? 'border-l-primary-400' : 'border-l-gray-300'}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary-500" />
                  <h3 className="font-semibold text-gray-900">{z.name}</h3>
                </div>
                <span className={`badge ${z.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {z.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {z.description && <p className="text-sm text-gray-500 mt-2">{z.description}</p>}
              <div className="mt-3 flex justify-between items-center text-sm">
                <div>
                  <p className="text-gray-500">Delivery Fee</p>
                  <p className="font-bold text-lg text-primary-600">{formatCurrency(z.delivery_fee)}</p>
                </div>
                {z.min_order_amount > 0 && (
                  <div className="text-right">
                    <p className="text-gray-500">Min Order</p>
                    <p className="font-medium">{formatCurrency(z.min_order_amount)}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                <button onClick={() => openEdit(z)} className="text-xs px-2 py-1 rounded border hover:bg-gray-50 flex items-center gap-1">
                  <Edit className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => deleteZone(z.id)} className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editZone ? 'Edit Zone' : 'Add Zone'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" required placeholder="e.g. Barangay San Jose" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" rows="2" placeholder="Coverage area details..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee (₱)</label>
              <input type="number" step="0.01" min="0" value={form.delivery_fee} onChange={e => setForm({ ...form, delivery_fee: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount (₱)</label>
              <input type="number" step="0.01" min="0" value={form.min_order_amount} onChange={e => setForm({ ...form, min_order_amount: e.target.value })} className="input-field" />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded border-gray-300" />
            <span className="text-sm text-gray-700">Active</span>
          </label>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editZone ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
