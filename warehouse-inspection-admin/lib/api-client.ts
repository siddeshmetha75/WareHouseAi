import axios, { type AxiosInstance, type AxiosError } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('warehouse_auth_token');
    if (token) {
      config.headers = config.headers || {};
      if (!config.headers['Authorization']) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('warehouse_auth_token');
      
      // Only redirect if we're in the browser
      if (typeof window !== 'undefined') {
        // Store the current URL to redirect back after login
        const returnUrl = window.location.pathname + window.location.search;
        window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
        
        // Show access denied message
        const event = new CustomEvent('show-toast', {
          detail: {
            type: 'error',
            message: 'Your session has expired. Please log in again.'
          }
        });
        window.dispatchEvent(event);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
