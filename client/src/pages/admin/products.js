/**
 * Admin - Product Management Page
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import api from '../../lib/api';
import { Plus, Search, Package, Edit, Trash2, ArrowUpDown } from 'lucide-react';
import { formatCurrency } from '../../../../shared/helpers';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [stockModal, setStockModal] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);
  const [stockAdj, setStockAdj] = useState({ type: 'add', quantity: 0, reason: '' });
  const [form, setForm] = useState({
    name: '', description: '', category: 'water', unit: 'gallon',
    price: '', stock_quantity: '', reorder_level: 10, is_active: true
  });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products/admin/all');
      setProducts(res.data.products);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form, price: parseFloat(form.price), stock_quantity: parseInt(form.stock_quantity), reorder_level: parseInt(form.reorder_level) };
      if (editProduct) {
        await api.put(`/products/${editProduct.id}`, data);
        toast.success('Product updated');
      } else {
        await api.post('/products', data);
        toast.success('Product created');
      }
      setModalOpen(false);
      setEditProduct(null);
      fetchProducts();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleStockAdj = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/products/${stockProduct.id}/adjust-stock`, stockAdj);
      toast.success('Stock adjusted');
      setStockModal(false);
      fetchProducts();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const openCreate = () => {
    setEditProduct(null);
    setForm({ name: '', description: '', category: 'water', unit: 'gallon', price: '', stock_quantity: '', reorder_level: 10, is_active: true });
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({ name: p.name, description: p.description || '', category: p.category, unit: p.unit, price: p.price, stock_quantity: p.stock_quantity, reorder_level: p.reorder_level, is_active: p.is_active });
    setModalOpen(true);
  };

  return (
    <AdminLayout title="Product Management">
      <Head><title>Products - Admin - JZ Waters</title></Head>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search products..." value={search}
            onChange={e => setSearch(e.target.value)} className="input-field pl-9 w-56" />
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center space-x-2">
          <Plus className="w-4 h-4" /> <span>Add Product</span>
        </button>
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={Package} title="No products found" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(p => (
            <div key={p.id} className={`card border-l-4 ${p.stock_quantity <= p.reorder_level ? 'border-l-red-400' : 'border-l-green-400'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{p.name}</h3>
                  <p className="text-sm text-gray-500">{p.category} &middot; {p.unit}</p>
                </div>
                <span className={`badge ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {p.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-xl font-bold text-primary-600">{formatCurrency(p.price)}</span>
                <div className="text-right">
                  <p className={`text-sm font-medium ${p.stock_quantity <= p.reorder_level ? 'text-red-600' : 'text-gray-700'}`}>
                    Stock: {p.stock_quantity}
                  </p>
                  <p className="text-xs text-gray-400">Reorder at {p.reorder_level}</p>
                </div>
              </div>
              {p.description && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{p.description}</p>}
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                <button onClick={() => { setStockProduct(p); setStockAdj({ type: 'add', quantity: 0, reason: '' }); setStockModal(true); }}
                  className="text-xs px-2 py-1 rounded border hover:bg-gray-50 flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3" /> Stock
                </button>
                <button onClick={() => openEdit(p)} className="text-xs px-2 py-1 rounded border hover:bg-gray-50 flex items-center gap-1">
                  <Edit className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => deleteProduct(p.id)} className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editProduct ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" rows="2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field">
                <option value="water">Water</option>
                <option value="container">Container</option>
                <option value="accessory">Accessory</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="input-field">
                <option value="gallon">Gallon</option>
                <option value="liter">Liter</option>
                <option value="bottle">Bottle</option>
                <option value="piece">Piece</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₱)</label>
              <input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
              <input type="number" min="0" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
              <input type="number" min="0" value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: e.target.value })} className="input-field" />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded border-gray-300" />
            <span className="text-sm text-gray-700">Active</span>
          </label>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editProduct ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal isOpen={stockModal} onClose={() => setStockModal(false)} title={`Adjust Stock - ${stockProduct?.name || ''}`}>
        <form onSubmit={handleStockAdj} className="space-y-4">
          <p className="text-sm text-gray-500">Current stock: <strong>{stockProduct?.stock_quantity}</strong></p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={stockAdj.type} onChange={e => setStockAdj({ ...stockAdj, type: e.target.value })} className="input-field">
                <option value="add">Add</option>
                <option value="subtract">Subtract</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" min="1" value={stockAdj.quantity} onChange={e => setStockAdj({ ...stockAdj, quantity: parseInt(e.target.value) || 0 })} className="input-field" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <input type="text" value={stockAdj.reason} onChange={e => setStockAdj({ ...stockAdj, reason: e.target.value })} className="input-field" placeholder="e.g. Restock, Breakage..." required />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setStockModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Adjust</button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
