import api from './client';

const MOCK_LOYALTY = {
  points_balance: 320,
  history: [],
};

export async function getMyPoints() {
  try {
    const res = await api.get('/customer/loyalty');
    return res.data.data; // { points_balance, history, meta }
  } catch {
    return MOCK_LOYALTY;
  }
}

export async function redeemPoints(points) {
  try {
    const res = await api.post('/customer/loyalty/redeem', { points });
    return res.data;
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || 'Failed to redeem points.',
    };
  }
}
