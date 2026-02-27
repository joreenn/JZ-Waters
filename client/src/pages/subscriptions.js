/**
 * Customer - Subscriptions Page
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/layout/Navbar';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { CalendarClock, Plus, Pause, Play, Trash2, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../shared/helpers';
import toast from 'react-hot-toast';

export default function Subscriptions() {
  const { user } = useAuth();
  const [subs, setSubs] = useState([]);
  const [products, setProducts] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    frequency: 'weekly', delivery_address: '', zone_id: '', items: []
  });

  useEffect(() => {
    fetchSubs();
    const loadData = async () => {
      try {
        const [pRes, zRes] = await Promise.all([api.get('/products'), api.get('/zones')]);
        setProducts(pRes.data.products);
        setZones(zRes.data.zones.filter(z => z.is_active));
      } catch { /* */ }
    };
    loadData();
  }, []);

  const fetchSubs = async () => {
    try {
      const res = await api.get('/subscriptions');
      setSubs(res.data.subscriptions || []);
    } catch { toast.error('Failed to load subscriptions'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (form.items.length === 0) { toast.error('Add at least one item'); return; }
    try {
      await api.post('/subscriptions', form);
      toast.success('Subscription created!');
      setModalOpen(false);
      fetchSubs();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const togglePause = async (id, action) => {
    try {
      await api.put(`/subscriptions/${id}/${action}`);
      toast.success(action === 'pause' ? 'Subscription paused' : 'Subscription resumed');
      fetchSubs();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const cancelSub = async (id) => {
    if (!confirm('Cancel this subscription?')) return;
    try {
      await api.delete(`/subscriptions/${id}`);
      toast.success('Subscription cancelled');
      fetchSubs();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const addItem = (productId) => {
    const existing = form.items.find(i => i.product_id == productId);
    if (existing) {
      setForm({ ...form, items: form.items.map(i => i.product_id == productId ? { ...i, quantity: i.quantity + 1 } : i) });
    } else {
      setForm({ ...form, items: [...form.items, { product_id: parseInt(productId), quantity: 1 }] });
    }
  };

  const removeItem = (productId) => {
    setForm({ ...form, items: form.items.filter(i => i.product_id != productId) });
  };

  const statusColors = { active: 'bg-green-100 text-green-700', paused: 'bg-yellow-100 text-yellow-700', cancelled: 'bg-red-100 text-red-700' };

  return (
    <>
      <Head><title>Subscriptions - JZ Waters</title></Head>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
              <p className="text-gray-500 mt-1">Manage your recurring water deliveries</p>
            </div>
            <button onClick={() => { setForm({ frequency: 'weekly', delivery_address: user?.address || '', zone_id: '', items: [] }); setModalOpen(true); }}
              className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Subscription
            </button>
          </div>

          {loading ? <LoadingSpinner /> : subs.length === 0 ? (
            <EmptyState icon={CalendarClock} title="No subscriptions" message="Set up automatic recurring deliveries" />
          ) : (
            <div className="space-y-4">
              {subs.map(s => (
                <div key={s.id} className="card">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <RefreshCw className="w-5 h-5 text-primary-500" />
                        <h3 className="font-semibold text-gray-900 capitalize">{s.frequency} Delivery</h3>
                        <span className={`badge ${statusColors[s.status] || 'bg-gray-100 text-gray-500'}`}>{s.status}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{s.delivery_address}</p>
                      {s.next_delivery_date && (
                        <p className="text-sm text-primary-600 mt-1">Next delivery: {formatDate(s.next_delivery_date)}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {s.status === 'active' && (
                        <button onClick={() => togglePause(s.id, 'pause')} className="btn-secondary text-sm flex items-center gap-1">
                          <Pause className="w-3 h-3" /> Pause
                        </button>
                      )}
                      {s.status === 'paused' && (
                        <button onClick={() => togglePause(s.id, 'resume')} className="btn-primary text-sm flex items-center gap-1">
                          <Play className="w-3 h-3" /> Resume
                        </button>
                      )}
                      {s.status !== 'cancelled' && (
                        <button onClick={() => cancelSub(s.id)} className="btn-danger text-sm flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Subscription" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} className="input-field">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Zone</label>
              <select value={form.zone_id} onChange={e => setForm({ ...form, zone_id: e.target.value })} className="input-field" required>
                <option value="">Select zone...</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
            <textarea value={form.delivery_address} onChange={e => setForm({ ...form, delivery_address: e.target.value })} className="input-field" rows="2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Products</label>
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
              {products.map(p => {
                const inList = form.items.find(i => i.product_id == p.id);
                return (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span>{p.name} — {formatCurrency(p.price)}/{p.unit}</span>
                    {inList ? (
                      <div className="flex items-center gap-2">
                        <span className="text-primary-600 font-medium">x{inList.quantity}</span>
                        <button type="button" onClick={() => addItem(p.id)} className="text-primary-600 text-xs">+1</button>
                        <button type="button" onClick={() => removeItem(p.id)} className="text-red-500 text-xs">Remove</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => addItem(p.id)} className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded">Add</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Subscription</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
