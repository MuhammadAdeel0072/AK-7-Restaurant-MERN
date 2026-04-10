import axios from 'axios';
import { io } from 'socket.io-client';

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

export const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://127.0.0.1:5000');


export default api;
