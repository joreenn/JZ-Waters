/**
 * Products Page - Customer browse & add to cart
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/layout/Navbar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { useCart } from '../contexts/CartContext';
import api from '../lib/api';
import { ShoppingCart, Plus, Minus, Package, Search, Filter } from 'lucide-react';
import { formatCurrency } from '../../../shared/helpers';
import toast from 'react-hot-toast';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const { addItem, items } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const params = {};
        if (category) params.category = category;
        const res = await api.get('/products', { params });
        setProducts(res.data.products);
      } catch { toast.error('Failed to load products'); }
      finally { setLoading(false); }
    };
    fetchProducts();
  }, [category]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const getCartQty = (productId) => {
    const item = items.find(i => i.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <>
      <Head><title>Products - JZ Waters</title></Head>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Our Products</h1>
            <p className="text-gray-500 mt-1">Fresh, purified water delivered to your doorstep</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search products..." value={search}
                onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
            </div>
            <select value={category} onChange={e => setCategory(e.target.value)} className="input-field w-40">
              <option value="">All Categories</option>
              <option value="water">Water</option>
              <option value="container">Container</option>
              <option value="accessory">Accessory</option>
            </select>
          </div>

          {/* Product Grid */}
          {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
            <EmptyState icon={Package} title="No products found" message="Try a different search or category" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map(p => {
                const qty = getCartQty(p.id);
                return (
                  <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="h-48 bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center">
                      <Package className="w-20 h-20 text-primary-300" />
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{p.name}</h3>
                        <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded">{p.category}</span>
                      </div>
                      {p.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{p.description}</p>}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xl font-bold text-primary-600">{formatCurrency(p.price)}</span>
                          <span className="text-xs text-gray-400 ml-1">/ {p.unit}</span>
                        </div>
                        {p.stock_quantity <= 0 ? (
                          <span className="text-xs text-red-500 font-medium">Out of stock</span>
                        ) : qty > 0 ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => addItem(p, -1)} className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-50">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-medium w-6 text-center">{qty}</span>
                            <button onClick={() => addItem(p, 1)} className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => { addItem(p, 1); toast.success('Added to cart'); }}
                            className="flex items-center gap-1 bg-primary-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors">
                            <ShoppingCart className="w-4 h-4" /> Add
                          </button>
                        )}
                      </div>
                      {p.stock_quantity > 0 && p.stock_quantity <= 10 && (
                        <p className="text-xs text-orange-500 mt-2">Only {p.stock_quantity} left</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
