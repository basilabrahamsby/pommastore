import axios from 'axios';

const api = axios.create({
  baseURL: typeof window === 'undefined'
    ? 'http://api:8000/api/v1/storefront'
    : (process.env.NEXT_PUBLIC_API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000/api/v1/storefront' : '/kozmocart/api/v1/storefront')),
});

import { useAuthStore } from '@/store/authStore';

// For client-side requests, we can inject the token from our auth store and handle errors
if (typeof window !== 'undefined') {
  api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/kozmocart/login?expired=true';
        }
      }
      return Promise.reject(error);
    }
  );
}

export default api;
