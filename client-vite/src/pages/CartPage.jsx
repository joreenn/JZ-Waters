import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { placeOrder } from '../api/orders';
import { deliveryZones } from '../data/products';

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const navigate = useNavigate();

  const [zoneId, setZoneId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);

  const zone = deliveryZones.find((z) => z.id === Number(zoneId));
  const deliveryFee = zone?.fee || 0;
  const grandTotal = cartTotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0 || !zoneId) return;
    setPlacing(true);
    try {
      const order = await placeOrder({
        items: cartItems.map((i) => ({
          product_id: i.id,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
        delivery_zone_id: Number(zoneId),
        delivery_fee: deliveryFee,
        payment_method: paymentMethod,
        total: grandTotal,
      });
      setSuccessOrder(order);
      clearCart();
    } catch {
      alert('Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (successOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 text-center max-w-md w-full"
        >
          <span className="text-6xl block mb-4">🎉</span>
          <h2 className="font-heading text-2xl font-bold text-darkText">Order Placed!</h2>
          <p className="text-gray-500 mt-2">
            Order #{successOrder.id} has been placed successfully.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => navigate(`/orders/${successOrder.id}`)}
              className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors min-h-[44px]"
            >
              Track My Order
            </button>
            <button
              onClick={() => navigate('/products')}
              className="w-full py-3 bg-white text-primary-600 font-bold rounded-xl border border-primary-200 hover:bg-primary-50 transition-colors min-h-[44px]"
            >
              Continue Shopping
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-sky py-12 relative overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bubble" />
        ))}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-3xl sm:text-4xl font-extrabold text-white"
          >
            Your Cart
          </motion.h1>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {cartItems.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl block mb-4">🛒</span>
            <p className="text-gray-500 text-lg">Your cart is empty.</p>
            <button
              onClick={() => navigate('/products')}
              className="mt-6 bg-primary-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors min-h-[44px]"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence>
                {cartItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 flex gap-4 items-center"
                  >
                    <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center text-3xl shrink-0">
                      {item.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-bold text-darkText text-sm sm:text-base truncate">{item.name}</h3>
                      <p className="text-primary-600 font-bold text-sm mt-0.5">₱{item.price} / {item.unit}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-darkText transition-colors"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-bold text-darkText">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-darkText transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <p className="font-bold text-darkText w-20 text-right">₱{item.price * item.quantity}</p>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-coral transition-colors p-1"
                      aria-label="Remove"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Summary sidebar */}
            <div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
                <h3 className="font-heading text-lg font-bold text-darkText mb-4">Order Summary</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-bold text-darkText">₱{cartTotal}</span>
                  </div>

                  {/* Zone selector */}
                  <div>
                    <label className="block text-gray-500 mb-1">Delivery Zone</label>
                    <select
                      value={zoneId}
                      onChange={(e) => setZoneId(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 min-h-[44px]"
                    >
                      <option value="">Select zone...</option>
                      {deliveryZones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name} — ₱{z.fee}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Delivery Fee</span>
                    <span className="font-bold text-darkText">₱{deliveryFee}</span>
                  </div>

                  {/* Payment method */}
                  <div>
                    <label className="block text-gray-500 mb-1">Payment Method</label>
                    <div className="flex gap-3">
                      {[
                        { value: 'cod', label: '💵 COD' },
                        { value: 'gcash', label: '📱 GCash' },
                      ].map((pm) => (
                        <button
                          key={pm.value}
                          onClick={() => setPaymentMethod(pm.value)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all min-h-[44px] ${
                            paymentMethod === pm.value
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-white text-darkText border-gray-200 hover:border-primary-300'
                          }`}
                        >
                          {pm.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  <div className="flex justify-between text-base">
                    <span className="font-semibold text-darkText">Total</span>
                    <span className="font-heading text-xl font-bold text-primary-600">₱{grandTotal}</span>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePlaceOrder}
                  disabled={!zoneId || cartItems.length === 0 || placing}
                  className="mt-6 w-full py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  {placing ? 'Placing Order...' : 'Place Order'}
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
