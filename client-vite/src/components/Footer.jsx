import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Footer() {
  const year = new Date().getFullYear();

  // Simple delivery-hours check (8 AM – 6 PM)
  const now = new Date();
  const isDeliveryTime = now.getHours() >= 8 && now.getHours() < 18;

  return (
    <footer className="bg-primary-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">💧</span>
              <span className="font-heading text-xl font-bold text-white">JZ Waters</span>
            </div>
            <p className="text-sm leading-relaxed">
              Clean, purified water for your home and business. Trusted by thousands of families.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-white font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">Products</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors">Track Order</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-heading text-white font-bold mb-4">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors">My Profile</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors">My Cart</Link></li>
            </ul>
          </div>

          {/* Store Hours & Delivery */}
          <div>
            <h4 className="font-heading text-white font-bold mb-4">Store Hours</h4>
            <ul className="space-y-2 text-sm">
              <li>Mon – Sat: 8:00 AM – 6:00 PM</li>
              <li>Sunday: Closed</li>
              <li className="pt-2">
                📞 <span className="text-white">09123456789</span>
              </li>
              <li>📍 123 Main St, Barangay Sample</li>
            </ul>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-full ${
                isDeliveryTime
                  ? 'bg-green/20 text-green'
                  : 'bg-coral/20 text-coral'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isDeliveryTime ? 'bg-green' : 'bg-coral'}`} />
              {isDeliveryTime ? 'Delivery available now' : 'Delivery closed'}
            </motion.div>
          </div>
        </div>

        <hr className="border-white/10 my-10" />

        <div className="text-center text-sm text-gray-400">
          &copy; {year} JZ Waters. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
