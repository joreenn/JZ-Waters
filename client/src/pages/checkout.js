/**
 * Checkout Page
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '../components/layout/Navbar';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { MapPin, CreditCard, Gift, ShoppingBag, Loader } from 'lucide-react';
import { formatCurrency } from '../../../shared/helpers';
import toast from 'react-hot-toast';

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [zones, setZones] = useState([]);
  const [loyalty, setLoyalty] = useState({ balance: 0, peso_value: 0 });
  const [placing, setPlacing] = useState(false);
  const [form, setForm] = useState({
    delivery_address: '',
    zone_id: '',
    payment_method: 'cash',
    redeem_points: 0,
    notes: ''
  });
  const [deliveryFee, setDeliveryFee] = useState(0);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (items.length === 0) { router.push('/cart'); return; }
    const init = async () => {
      try {
        const [zRes, lRes] = await Promise.all([
          api.get('/zones'),
          api.get('/loyalty/balance').catch(() => ({ data: { balance: 0, peso_value: 0 } }))
        ]);
        setZones(zRes.data.zones.filter(z => z.is_active));
        setLoyalty(lRes.data);
        if (user.address) setForm(f => ({ ...f, delivery_address: user.address }));
      } catch { /* */ }
    };
    init();
  }, [user, items.length, router]);

  useEffect(() => {
    const zone = zones.find(z => z.id == form.zone_id);
    setDeliveryFee(zone ? parseFloat(zone.delivery_fee) : 0);
  }, [form.zone_id, zones]);

  const discount = Math.min(parseFloat(form.redeem_points) || 0, loyalty.balance) * (loyalty.peso_per_point || 0.1);
  const total = subtotal + deliveryFee - discount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.zone_id) { toast.error('Please select a delivery zone'); return; }
    if (!form.delivery_address) { toast.error('Please enter delivery address'); return; }

    setPlacing(true);
    try {
      const orderData = {
        items: items.map(i => ({ product_id: i.id, quantity: i.quantity })),
        delivery_address: form.delivery_address,
        zone_id: parseInt(form.zone_id),
        payment_method: form.payment_method,
        redeem_points: parseInt(form.redeem_points) || 0,
        notes: form.notes
      };
      const res = await api.post('/orders', orderData);
      clearCart();
      toast.success('Order placed successfully!');
      router.push(`/orders/${res.data.order.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    } finally { setPlacing(false); }
  };

  if (!user || items.length === 0) return null;

  return (
    <>
      <Head><title>Checkout - JZ Waters</title></Head>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left - Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Delivery */}
                <div className="card">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-primary-600" /> Delivery Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Zone</label>
                      <select value={form.zone_id} onChange={e => setForm({ ...form, zone_id: e.target.value })} className="input-field" required>
                        <option value="">Select zone...</option>
                        {zones.map(z => (
                          <option key={z.id} value={z.id}>{z.name} — {formatCurrency(z.delivery_fee)} fee</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                      <textarea value={form.delivery_address}
                        onChange={e => setForm({ ...form, delivery_address: e.target.value })}
                        className="input-field" rows="2" required placeholder="Complete delivery address..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes (optional)</label>
                      <input type="text" value={form.notes}
                        onChange={e => setForm({ ...form, notes: e.target.value })}
                        className="input-field" placeholder="Delivery instructions, landmark, etc." />
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div className="card">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-primary-600" /> Payment Method
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'cash', label: 'Cash on Delivery' },
                      { value: 'gcash', label: 'GCash' },
                      { value: 'bank_transfer', label: 'Bank Transfer' },
                      { value: 'maya', label: 'Maya' },
                    ].map(pm => (
                      <label key={pm.value}
                        className={`p-3 border rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${form.payment_method === pm.value ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="radio" name="payment" value={pm.value}
                          checked={form.payment_method === pm.value}
                          onChange={e => setForm({ ...form, payment_method: e.target.value })}
                          className="text-primary-600" />
                        <span className="text-sm font-medium">{pm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Loyalty Points */}
                {loyalty.balance > 0 && (
                  <div className="card">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                      <Gift className="w-5 h-5 text-primary-600" /> Loyalty Points
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Available: <strong>{loyalty.balance} points</strong> (worth {formatCurrency(loyalty.peso_value)})
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Points to Redeem</label>
                      <input type="number" min="0" max={loyalty.balance}
                        value={form.redeem_points}
                        onChange={e => setForm({ ...form, redeem_points: e.target.value })}
                        className="input-field max-w-xs" placeholder="0" />
                      {discount > 0 && (
                        <p className="text-sm text-green-600 mt-1">You save {formatCurrency(discount)}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right - Summary */}
              <div className="lg:col-span-1">
                <div className="card sticky top-24">
                  <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
                  <div className="space-y-3 mb-4">
                    {items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-500">{item.name} x{item.quantity}</span>
                        <span>{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Delivery Fee</span>
                      <span>{deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Select zone'}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Points Discount</span>
                        <span>-{formatCurrency(discount)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-primary-600">{formatCurrency(Math.max(total, 0))}</span>
                      </div>
                    </div>
                  </div>
                  <button type="submit" disabled={placing}
                    className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
                    {placing ? <><Loader className="w-4 h-4 animate-spin" /> Placing Order...</> : 'Place Order'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
