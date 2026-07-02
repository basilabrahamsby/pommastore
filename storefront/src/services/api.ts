import axios from 'axios';

const api = axios.create({
  baseURL: typeof window === 'undefined'
    ? 'http://api:8000/api/v1/storefront'
    : (process.env.NEXT_PUBLIC_API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000/api/v1/storefront' : '/api/v1/storefront')),
  timeout: 15000, // 15 seconds timeout for slow connections
});

import { useAuthStore } from '@/store/authStore';

const isCacheableUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  const exact = ['/settings/storefront_layout', '/offers', '/brands', '/categories', '/homepage'];
  if (exact.some(key => url === key || url.endsWith(key))) return true;
  if (url.includes('/products')) return true;
  return false;
};

// For client-side requests, inject token and handle caching / low-internet fallbacks
if (typeof window !== 'undefined') {
  api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Serve cached settings immediately if available and under 5 minutes old
    if (config.method === 'get' && config.url && isCacheableUrl(config.url)) {
      try {
        const cached = sessionStorage.getItem(`cache:${config.url}`);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 300000) { // 5 minutes TTL
            config.adapter = () => {
              return Promise.resolve({
                data,
                status: 200,
                statusText: 'OK',
                headers: {},
                config,
              });
            };
          }
        }
      } catch (_) {}
    }

    return config;
  });

  api.interceptors.response.use(
    (response) => {
      // Store successful GET layout/config responses in cache
      const url = response.config.url;
      if (response.config.method === 'get' && url && isCacheableUrl(url)) {
        try {
          sessionStorage.setItem(`cache:${url}`, JSON.stringify({
            data: response.data,
            timestamp: Date.now()
          }));
        } catch (_) {}
      }
      return response;
    },
    async (error) => {
      const config = error.config;
      // Low-internet Recovery: Fallback to session cache on network error or timeout
      if (config && config.method === 'get' && config.url && isCacheableUrl(config.url)) {
        try {
          const cached = sessionStorage.getItem(`cache:${config.url}`);
          if (cached) {
            const { data } = JSON.parse(cached);
            console.warn(`Low internet recovery mode: served fallback cache for ${config.url}`);
            return {
              data,
              status: 200,
              statusText: 'OK',
              headers: {},
              config,
            };
          }
        } catch (_) {}
      }

      if (error.response?.status === 401) {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login?expired=true';
        }
      }
      return Promise.reject(error);
    }
  );
}

export default api;
