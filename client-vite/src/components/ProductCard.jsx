import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';

const badgeColors = {
  'Best Seller': 'bg-gold text-white',
  'New': 'bg-green text-white',
  'Value': 'bg-coral text-white',
};

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(21,101,192,0.12)' }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5 }}
      className="relative bg-white rounded-2xl border border-primary-100 overflow-hidden flex flex-col"
    >
      {/* Badge */}
      {product.badge && (
        <span
          className={`absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full z-10 ${
            badgeColors[product.badge] || 'bg-primary-400 text-white'
          }`}
        >
          {product.badge}
        </span>
      )}

      {/* Emoji illustration area */}
      <div className="bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-10">
        <span className="text-6xl select-none">{product.emoji}</span>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-heading text-lg font-bold text-darkText leading-snug">
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-gray-500 leading-relaxed flex-1">
          {product.description}
        </p>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <span className="text-2xl font-bold text-primary-600">₱{product.price}</span>
            <span className="text-xs text-gray-400 ml-1">/ {product.unit}</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => addToCart(product)}
            className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors min-h-[44px]"
          >
            Add to Cart
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
