import api from './client';

// ── Mock fallback ──
const MOCK_USER = {
  id: 1,
  name: 'Juan Dela Cruz',
  email: 'juan@example.com',
  phone: '09171234567',
  address: '123 Main St, Barangay Sample',
  role: 'customer',
  points_balance: 0,
};

const MOCK_TOKEN = 'mock-jwt-token-placeholder';

export async function login(email, password) {
  try {
    const res = await api.post('/auth/login', { email, password });
    // Laravel returns { success, message, data: { user, token } }
    return res.data.data;
  } catch {
    return { token: MOCK_TOKEN, user: { ...MOCK_USER, email } };
  }
}

export async function register(userData) {
  try {
    const res = await api.post('/auth/register', userData);
    return res.data.data;
  } catch {
    return {
      token: MOCK_TOKEN,
      user: { ...MOCK_USER, ...userData, id: Date.now() },
    };
  }
}

export async function getMe() {
  try {
    const res = await api.get('/auth/me');
    return res.data.data;
  } catch {
    return MOCK_USER;
  }
}

export async function updateProfile(data) {
  try {
    const res = await api.put('/auth/profile', data);
    return res.data.data;
  } catch {
    return { ...MOCK_USER, ...data };
  }
}

export async function updatePassword(data) {
  const res = await api.put('/auth/password', data);
  return res.data;
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } catch {
    // Ignore errors on logout
  }
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
