import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
});

// Add JWT Interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dinexis_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Basic Queries
export const getAvailableOrders = async () => {
    const { data } = await api.get('/rider/available');
    return data;
};

export const getNearbyOrders = async (lat, lng) => {
    const { data } = await api.get('/rider/nearby-orders', { params: { lat, lng } });
    return data;
};

export const getMyOrders = async (lat, lng) => {
    const { data } = await api.get('/rider/my-orders', { params: { lat, lng } });
    return data;
};

export const getRiderStats = async () => {
    const { data } = await api.get('/rider/stats');
    return data;
};

// Workflow Methods
export const claimOrder = async (orderId) => {
    const { data } = await api.post(`/rider/claim/${orderId}`);
    return data;
};

export const acceptOrder = async (orderId) => {
    const { data } = await api.post(`/rider/accept/${orderId}`);
    return data;
};

export const pickupOrder = async (orderId) => {
    const { data } = await api.post(`/rider/pickup/${orderId}`);
    return data;
};

export const arrivedAtDestination = async (orderId) => {
    const { data } = await api.post(`/rider/arrived/${orderId}`);
    return data;
};

export const confirmDelivery = async (orderId, payload = {}) => {
    const { data } = await api.post(`/rider/delivered/${orderId}`, payload);
    return data;
};

export const updateLocation = async (orderId, lat, lng) => {
    const { data } = await api.post('/rider/location', { orderId, lat, lng });
    return data;
};

// Smart Batching
export const addToRoute = async (orderId, location) => {
    const { data } = await api.post(`/rider/add-to-route/${orderId}`, location);
    return data;
};

export default api;
