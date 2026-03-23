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
import { ShoppingCart, Plus, Minus, Package } from 'lucide-react';
import { formatCurrency } from '../../../shared/helpers';
import toast from 'react-hot-toast';

const CATEGORY_OPTIONS = ['All', 'Water Products', 'Containers', 'Accessories'];
const PLACEHOLDER_IMAGE = 'https://placehold.co/600x400/e2e8f0/475569?text=JZ+Waters';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const { addItem, items } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {};
        if (category !== 'All') params.category = category;
        const res = await api.get('/products', { params });
        setProducts(Array.isArray(res.data) ? res.data : []);
      } catch { toast.error('Failed to load products'); }
      finally { setLoading(false); }
    };
    fetchProducts();
  }, [category]);

  const getCartQty = (productId) => {
    const item = items.find(i => i.product_id === productId);
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

          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORY_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCategory(option)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  category === option
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          {loading ? <LoadingSpinner /> : products.length === 0 ? (
            <EmptyState icon={Package} title="No products found." message="Try another category." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(p => {
                const qty = getCartQty(p.id);
                return (
                  <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    <img
                      src={p.image_url || PLACEHOLDER_IMAGE}
                      alt={p.name}
                      className="h-48 w-full object-cover bg-gray-100"
                      onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
                    />
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{p.name}</h3>
                        <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded">{p.category}</span>
                      </div>
                      {p.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{p.description}</p>}
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-primary-600">{formatCurrency(p.price)}</span>
                        {qty > 0 ? (
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
