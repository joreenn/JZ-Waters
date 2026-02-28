import api from './client';

const MOCK_ORDERS = [
  {
    id: 1001,
    status: 'delivered',
    items: [
      { product: { name: 'Purified Water 5 Gallon' }, quantity: 3, unit_price: 35, subtotal: 105 },
      { product: { name: 'Alkaline Water 1 Gallon' }, quantity: 2, unit_price: 25, subtotal: 50 },
    ],
    total_amount: 185,
    delivery_fee: 30,
    payment_method: 'cod',
    created_at: '2026-02-20T10:00:00Z',
    delivery: { delivery_staff: { name: 'Mark Santos', phone: '09181234567' } },
  },
  {
    id: 1002,
    status: 'out_for_delivery',
    items: [
      { product: { name: 'Mineral Water 5 Gallon' }, quantity: 2, unit_price: 65, subtotal: 130 },
    ],
    total_amount: 175,
    delivery_fee: 45,
    payment_method: 'gcash',
    created_at: '2026-02-27T14:30:00Z',
    delivery: { delivery_staff: { name: 'Carlo Reyes', phone: '09191234567' } },
  },
];

export async function placeOrder(orderData) {
  try {
    const res = await api.post('/customer/orders', orderData);
    return res.data.data;
  } catch {
    return {
      id: Date.now(),
      status: 'pending',
      ...orderData,
      created_at: new Date().toISOString(),
    };
  }
}

export async function getMyOrders() {
  try {
    const res = await api.get('/customer/orders');
    return res.data.data;
  } catch {
    return MOCK_ORDERS;
  }
}

export async function trackOrder(orderId) {
  try {
    const res = await api.get(`/customer/orders/${orderId}`);
    return res.data.data;
  } catch {
    return (
      MOCK_ORDERS.find((o) => o.id === Number(orderId)) || {
        id: orderId,
        status: 'confirmed',
        items: [{ product: { name: 'Purified Water 5 Gallon' }, quantity: 2, unit_price: 35, subtotal: 70 }],
        total_amount: 100,
        delivery_fee: 30,
        payment_method: 'cod',
        created_at: new Date().toISOString(),
        delivery: { delivery_staff: { name: 'Mark Santos', phone: '09181234567' } },
      }
    );
  }
}

export async function cancelOrder(orderId) {
  try {
    const res = await api.post(`/customer/orders/${orderId}/cancel`);
    return res.data;
  } catch {
    return { success: false, message: 'Unable to cancel order.' };
  }
}
