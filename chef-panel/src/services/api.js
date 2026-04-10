import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
});

// Add JWT Interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ak7_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export const getActiveOrders = async () => {
    const { data } = await api.get('/chef/orders');
    return data;
};

export const getReadyOrders = async () => {
    const { data } = await api.get('/chef/ready-orders');
    return data;
};

export const updateOrderStatus = async (id, status) => {
    const { data } = await api.patch('/chef/order/status', { id, status });
    return data;
};

export const updateItemStatus = async (orderId, itemId, status) => {
    const { data } = await api.patch('/chef/order/item-status', { orderId, itemId, status });
    return data;
};

export const getKitchenStats = async () => {
    const { data } = await api.get('/chef/stats');
    return data;
};

export default api;
