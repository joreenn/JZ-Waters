export default function OrderCard({ order }) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    out_for_delivery: 'bg-purple-100 text-purple-800',
    delivered: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const statusLabel = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <p className="font-heading text-lg font-bold text-darkText">Order #{order.id}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(order.created_at).toLocaleDateString('en-PH', {
              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
          {statusLabel[order.status] || order.status}
        </span>
      </div>

      <div className="divide-y divide-gray-50">
        {order.items?.map((item, i) => (
          <div key={i} className="flex justify-between py-2 text-sm">
            <span className="text-gray-700">
              {item.name} × {item.quantity}
            </span>
            <span className="font-semibold text-darkText">₱{item.price * item.quantity}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm">
        <span className="text-gray-500">Delivery Fee</span>
        <span className="font-semibold text-darkText">₱{order.delivery_fee || 0}</span>
      </div>
      <div className="flex justify-between mt-1 text-sm">
        <span className="text-gray-500">Payment</span>
        <span className="font-semibold text-darkText uppercase">{order.payment_method}</span>
      </div>
      <div className="flex justify-between mt-2 pt-3 border-t border-gray-100">
        <span className="font-semibold text-darkText">Total</span>
        <span className="font-heading text-xl font-bold text-primary-600">₱{order.total}</span>
      </div>
    </div>
  );
}
