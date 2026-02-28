import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { products } from '../data/products';
import ProductCard from '../components/ProductCard';
import LoyaltyCard from '../components/LoyaltyCard';

/* ── Animation Variants ── */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

function Bubbles() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bubble" />
      ))}
    </>
  );
}

export default function HomePage() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);

  const featuredProducts = products.slice(0, 3);

  return (
    <div className="overflow-hidden">
      {/* ════════ HERO ════════ */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-sky min-h-[90vh] flex items-center overflow-hidden">
        {/* Blob decorations */}
        <div className="blob w-96 h-96 bg-sky/40 -top-32 -left-32" />
        <div className="blob w-80 h-80 bg-primary-400/30 bottom-10 right-10" />
        <Bubbles />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full py-16 lg:py-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left text */}
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              style={{ y: heroY }}
            >
              <motion.span
                variants={fadeUp}
                className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-6"
              >
                🚚 Free delivery on first order!
              </motion.span>

              <motion.h1
                variants={fadeUp}
                className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight"
              >
                Pure Water,{' '}
                <span className="text-pale">Delivered Fresh</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-6 text-lg text-primary-100 leading-relaxed max-w-lg"
              >
                JZ Waters provides clean, purified water for your home and business.
                Order online and get it delivered straight to your door.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center bg-white text-primary-700 font-bold px-7 py-3.5 rounded-xl hover:bg-primary-50 transition-colors text-base min-h-[44px]"
                >
                  Order Now →
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center border-2 border-white/40 text-white font-bold px-7 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-base min-h-[44px]"
                >
                  Create Account
                </Link>
              </motion.div>
            </motion.div>

            {/* Right: floating product cards */}
            <div className="relative flex items-center justify-center min-h-[320px] lg:min-h-[420px]">
              {featuredProducts.map((p, i) => {
                const yOffsets = [0, -20, 10];
                const xOffsets = [-20, 30, 0];
                const delays = [0, 2, 1];
                const durations = [6, 7, 5.5];
                return (
                  <motion.div
                    key={p.id}
                    className="absolute w-44 sm:w-52"
                    style={{
                      top: `${20 + i * 28}%`,
                      left: `${10 + i * 25}%`,
                    }}
                    animate={{
                      y: [yOffsets[i], yOffsets[i] - 18, yOffsets[i]],
                    }}
                    transition={{
                      duration: durations[i],
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: delays[i],
                    }}
                  >
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-4 border border-white/50">
                      <div className="text-4xl text-center mb-2">{p.emoji}</div>
                      <p className="font-heading text-sm font-bold text-darkText text-center truncate">{p.name}</p>
                      <p className="text-primary-600 font-bold text-center mt-1">₱{p.price}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 120" fill="none" className="w-full">
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H0Z"
              fill="#f8fafc"
            />
          </svg>
        </div>
      </section>

      {/* ════════ WHY US ════════ */}
      <section className="py-20 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl sm:text-4xl font-bold text-center text-darkText mb-14"
          >
            Why Choose <span className="text-primary-600">JZ Waters?</span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { emoji: '💧', title: 'Pure & Safe', desc: 'Multi-stage purification process ensuring the cleanest water for your family.' },
              { emoji: '🚚', title: 'Fast Delivery', desc: 'Same-day delivery available. Track your order in real-time.' },
              { emoji: '🛡️', title: 'Quality Guaranteed', desc: 'FDA-approved facility with strict quality control at every step.' },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="bg-white rounded-2xl border border-primary-100 p-8 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl">
                  {card.emoji}
                </div>
                <h3 className="font-heading text-xl font-bold text-darkText">{card.title}</h3>
                <p className="mt-3 text-gray-500 leading-relaxed text-sm">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ HOW IT WORKS ════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl sm:text-4xl font-bold text-center text-darkText mb-14"
          >
            How It Works
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { step: '1', emoji: '🔍', title: 'Browse', desc: 'Choose from our water products' },
              { step: '2', emoji: '🛒', title: 'Order', desc: 'Add to cart and checkout' },
              { step: '3', emoji: '🚛', title: 'Deliver', desc: 'We deliver to your door' },
              { step: '4', emoji: '😊', title: 'Enjoy', desc: 'Fresh water, always!' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto text-2xl font-bold shadow-lg shadow-primary-200">
                  {item.emoji}
                </div>
                <h3 className="font-heading text-lg font-bold text-darkText mt-4">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ FEATURED PRODUCTS ════════ */}
      <section className="py-20 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl sm:text-4xl font-bold text-center text-darkText mb-4"
          >
            Our Products
          </motion.h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            From purified to alkaline — we have the perfect water for every need.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-primary-600 font-bold hover:text-primary-700 transition-colors"
            >
              View All Products →
            </Link>
          </div>
        </div>
      </section>

      {/* ════════ LOYALTY ════════ */}
      <section className="py-20 bg-primary-50 relative overflow-hidden">
        <div className="blob w-72 h-72 bg-primary-200/40 -top-20 -right-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-4xl">⭐</span>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-darkText mt-4">
                Earn Loyalty Points
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Every gallon you order earns you points. Redeem them for discounts on your next delivery!
                Join thousands of happy customers saving on every order.
              </p>
              <Link
                to="/register"
                className="mt-6 inline-flex items-center bg-primary-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors min-h-[44px]"
              >
                Join Now & Start Earning
              </Link>
            </motion.div>

            <div className="flex justify-center lg:justify-end">
              <LoyaltyCard
                points={320}
                nextTier={2000}
                tier="Silver"
                perks={[
                  'Free delivery on orders over ₱200',
                  '5% discount on every order',
                  'Priority customer support',
                  'Birthday bonus 50 points',
                ]}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
