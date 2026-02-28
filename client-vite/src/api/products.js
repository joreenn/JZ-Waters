import api from './client';
import { products as mockProducts } from '../data/products';

export async function getProducts(category) {
  try {
    const params = category ? { category } : {};
    const res = await api.get('/products', { params });
    return res.data.data; // Laravel: { success, data: [...] }
  } catch {
    if (category) return mockProducts.filter((p) => p.category === category);
    return mockProducts;
  }
}

export async function getProductById(id) {
  try {
    const res = await api.get(`/products/${id}`);
    return res.data.data;
  } catch {
    return mockProducts.find((p) => p.id === Number(id)) || null;
  }
}

export async function getZones() {
  try {
    const res = await api.get('/zones');
    return res.data.data;
  } catch {
    // Fallback zones
    return [
      { id: 1, name: 'Zone A – Nearby', delivery_fee: 30 },
      { id: 2, name: 'Zone B – Midrange', delivery_fee: 50 },
      { id: 3, name: 'Zone C – Far', delivery_fee: 75 },
      { id: 4, name: 'Zone D – Extended', delivery_fee: 100 },
    ];
  }
}
