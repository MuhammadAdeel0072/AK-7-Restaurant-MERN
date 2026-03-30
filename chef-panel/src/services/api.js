import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

export const getActiveOrders = async () => {
    const { data } = await api.get('/chef/orders');
    return data;
};

export const updateOrderStatus = async (id, status) => {
    const { data } = await api.put(`/chef/orders/${id}/status`, { status });
    return data;
};

export const getKitchenStats = async () => {
    const { data } = await api.get('/chef/stats');
    return data;
};

export default api;
