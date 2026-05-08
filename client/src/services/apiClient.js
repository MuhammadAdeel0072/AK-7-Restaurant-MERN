import axios from 'axios';
import toast from 'react-hot-toast';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Add JWT Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dinexis_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Error Handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - session expired or invalid
      console.warn('Unauthorized — session may have expired');
      // Potential redirect to login could happen here if we had access to history
    } else if (error.response?.status >= 500) {
      const errorDetail = error.response?.data?.message || 'Server error';
      toast.error(`System Error: ${errorDetail}`);
    }
    return Promise.reject(error);
  }
);

export default apiClient;

