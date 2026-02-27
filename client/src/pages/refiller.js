/**
 * Refiller Dashboard
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import StaffLayout from '../components/layout/StaffLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import api from '../lib/api';
import { Droplets, Plus, BarChart3, Clock, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../../shared/helpers';
import toast from 'react-hot-toast';

export default function RefillerDashboard() {
  const [refills, setRefills] = useState([]);
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    product_id: '', quantity: 1, customer_name: '', payment_method: 'cash', amount_paid: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [rRes, pRes, sRes] = await Promise.all([
        api.get('/refills'),
        api.get('/products'),
        api.get('/refills/summary').catch(() => ({ data: { summary: {} } }))
      ]);
      setRefills(rRes.data.refills || []);
      setProducts(pRes.data.products || []);
      setSummary(sRes.data.summary);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/refills', {
        ...form,
        product_id: parseInt(form.product_id),
        quantity: parseInt(form.quantity),
        amount_paid: parseFloat(form.amount_paid)
      });
      toast.success('Refill logged!');
      setModalOpen(false);
      setForm({ product_id: '', quantity: 1, customer_name: '', payment_method: 'cash', amount_paid: '' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const selectedProduct = products.find(p => p.id == form.product_id);

  return (
    <StaffLayout role="refiller">
      <Head><title>Refiller Dashboard - JZ Waters</title></Head>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Droplets className="w-8 h-8 text-primary-600" /> Refill Station
            </h1>
            <p className="text-gray-500 mt-1">Log walk-in refill transactions</p>
          </div>
          <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Refill
          </button>
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            {/* Daily Summary */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="card text-center">
                  <BarChart3 className="w-6 h-6 text-primary-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{summary.total_transactions || 0}</p>
                  <p className="text-sm text-gray-500">Today's Transactions</p>
                </div>
                <div className="card text-center">
                  <Droplets className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{summary.total_gallons || 0}</p>
                  <p className="text-sm text-gray-500">Gallons Refilled</p>
                </div>
                <div className="card text-center">
                  <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_revenue || 0)}</p>
                  <p className="text-sm text-gray-500">Today's Revenue</p>
                </div>
                <div className="card text-center">
                  <Clock className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.avg_transaction || 0)}</p>
                  <p className="text-sm text-gray-500">Avg Transaction</p>
                </div>
              </div>
            )}

            {/* Recent Refills */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
              {refills.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No refill transactions yet today</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="pb-3 font-medium">Time</th>
                        <th className="pb-3 font-medium">Customer</th>
                        <th className="pb-3 font-medium">Product</th>
                        <th className="pb-3 font-medium">Qty</th>
                        <th className="pb-3 font-medium">Amount</th>
                        <th className="pb-3 font-medium">Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {refills.map(r => (
                        <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 text-gray-500 text-xs">{formatDateTime(r.created_at)}</td>
                          <td className="py-3 font-medium">{r.customer_name || 'Walk-in'}</td>
                          <td className="py-3">{r.product_name}</td>
                          <td className="py-3">{r.quantity}</td>
                          <td className="py-3 font-medium text-green-600">{formatCurrency(r.amount_paid)}</td>
                          <td className="py-3 capitalize">{r.payment_method}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* New Refill Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Log Refill Transaction">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <select value={form.product_id} onChange={e => {
              setForm({ ...form, product_id: e.target.value });
            }} className="input-field" required>
              <option value="">Select product...</option>
              {products.filter(p => p.category === 'water').map(p => (
                <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}/{p.unit}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" min="1" value={form.quantity}
                onChange={e => {
                  const qty = parseInt(e.target.value) || 1;
                  setForm({ ...form, quantity: qty, amount_paid: selectedProduct ? (selectedProduct.price * qty).toFixed(2) : form.amount_paid });
                }}
                className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (₱)</label>
              <input type="number" step="0.01" min="0" value={form.amount_paid}
                onChange={e => setForm({ ...form, amount_paid: e.target.value })}
                className="input-field" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name (optional)</label>
            <input type="text" value={form.customer_name}
              onChange={e => setForm({ ...form, customer_name: e.target.value })}
              className="input-field" placeholder="Walk-in customer" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} className="input-field">
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Log Refill</button>
          </div>
        </form>
      </Modal>
    </StaffLayout>
  );
}
