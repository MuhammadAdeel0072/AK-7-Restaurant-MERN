import axios from 'axios';

const api = axios.create({
  // Use relative path to leverage Vite proxy in development
  // In production, the backend and frontend are usually served from the same origin or via env var
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Add JWT Interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dinexis_token');
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

export const startCookingOrder = async (id) => {
    const { data } = await api.put(`/orders/${id}/start`);
    return data;
};

export const markOrderReady = async (id) => {
    const { data } = await api.put(`/orders/${id}/ready`);
    return data;
};

export const dispatchOrder = async (id, chefFeedback) => {
    const { data } = await api.put(`/orders/${id}/dispatch`, { chefFeedback });
    return data;
};

export const getKitchenStats = async () => {
    const { data } = await api.get('/chef/stats');
    return data;
};

export default api;
