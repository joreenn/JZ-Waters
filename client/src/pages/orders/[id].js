/**
 * Order Detail Page
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { ArrowLeft, MapPin, CreditCard, Clock, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../../../shared/helpers';
import toast from 'react-hot-toast';

const statusSteps = ['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered'];
const stepIcons = { pending: Clock, confirmed: Package, processing: Package, out_for_delivery: Truck, delivered: CheckCircle };

export default function OrderDetail() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data.order);
      } catch {
        toast.error('Order not found');
        router.push('/orders');
      } finally { setLoading(false); }
    };
    fetchOrder();
  }, [id, user, router]);

  const cancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.put(`/orders/${id}/status`, { status: 'cancelled' });
      toast.success('Order cancelled');
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data.order);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to cancel'); }
  };

  if (!user) return null;

  return (
    <>
      <Head><title>Order {order?.order_number || ''} - JZ Waters</title></Head>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/orders" className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </Link>

          {loading ? <LoadingSpinner /> : !order ? null : (
            <div className="space-y-6">
              {/* Header */}
              <div className="card">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
                    <p className="text-sm text-gray-500 mt-1">Placed on {formatDateTime(order.created_at)}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              </div>

              {/* Status Progress */}
              {order.status !== 'cancelled' && (
                <div className="card">
                  <h3 className="font-semibold text-gray-900 mb-4">Order Progress</h3>
                  <div className="flex items-center justify-between">
                    {statusSteps.map((step, i) => {
                      const currentIndex = statusSteps.indexOf(order.status);
                      const isActive = i <= currentIndex;
                      const Icon = stepIcons[step];
                      return (
                        <div key={step} className="flex flex-col items-center flex-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className={`text-xs mt-1 capitalize ${isActive ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
                            {step.replace('_', ' ')}
                          </span>
                          {i < statusSteps.length - 1 && (
                            <div className={`absolute h-0.5 w-full ${i < currentIndex ? 'bg-primary-600' : 'bg-gray-200'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {/* Delivery Details */}
                <div className="card">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-primary-600" /> Delivery Details
                  </h3>
                  <div className="text-sm space-y-2">
                    <p><span className="text-gray-500">Address:</span> {order.delivery_address}</p>
                    {order.zone_name && <p><span className="text-gray-500">Zone:</span> {order.zone_name}</p>}
                    {order.driver_name && <p><span className="text-gray-500">Driver:</span> {order.driver_name}</p>}
                    {order.notes && <p><span className="text-gray-500">Notes:</span> {order.notes}</p>}
                  </div>
                </div>

                {/* Payment Info */}
                <div className="card">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                    <CreditCard className="w-4 h-4 text-primary-600" /> Payment
                  </h3>
                  <div className="text-sm space-y-2">
                    <p><span className="text-gray-500">Method:</span> {order.payment_method?.replace('_', ' ')}</p>
                    <p><span className="text-gray-500">Status:</span> <span className="capitalize">{order.payment_status}</span></p>
                    {order.points_earned > 0 && <p className="text-green-600">+{order.points_earned} loyalty points earned</p>}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2">Product</th>
                      <th className="pb-2 text-center">Qty</th>
                      <th className="pb-2 text-right">Price</th>
                      <th className="pb-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((it, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-2 font-medium">{it.product_name}</td>
                        <td className="py-2 text-center">{it.quantity}</td>
                        <td className="py-2 text-right">{formatCurrency(it.unit_price)}</td>
                        <td className="py-2 text-right">{formatCurrency(it.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t mt-2 pt-3 space-y-1 text-sm text-right">
                  <p>Delivery Fee: {formatCurrency(order.delivery_fee)}</p>
                  {order.discount_amount > 0 && <p className="text-green-600">Discount: -{formatCurrency(order.discount_amount)}</p>}
                  <p className="text-xl font-bold text-primary-600">Total: {formatCurrency(order.total_amount)}</p>
                </div>
              </div>

              {/* Cancel */}
              {order.status === 'pending' && (
                <div className="flex justify-end">
                  <button onClick={cancelOrder} className="btn-danger flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Cancel Order
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
