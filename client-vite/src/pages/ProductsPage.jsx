import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import { getProducts } from '../api/products';

const FILTERS = ['All', 'Purified', 'Alkaline', 'Mineral'];

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [active, setActive] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  const filtered = active === 'All' ? products : products.filter((p) => p.category === active);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-sky py-16 relative overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bubble" />
        ))}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-3xl sm:text-4xl font-extrabold text-white"
          >
            Our Products
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-primary-100 max-w-lg mx-auto"
          >
            From purified to alkaline — we have the perfect water for every need.
          </motion.p>
        </div>
      </section>

      {/* Filters + Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {FILTERS.map((f) => (
            <motion.button
              key={f}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActive(f)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all min-h-[44px] ${
                active === f
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                  : 'bg-white text-darkText border border-gray-200 hover:border-primary-300'
              }`}
            >
              {f}
            </motion.button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading products...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No products found.</div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
