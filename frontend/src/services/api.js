import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return '/pommastore/api/v1'
  }
  return '/api/v1'
}

const api = axios.create({ baseURL: getBaseUrl() })

api.interceptors.request.use(cfg => {
  const token = useAuthStore.getState().token
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    const isLoginRequest = err.config?.url?.includes('/auth/login')

    // 401 (Unauthorized) or 403 (Forbidden) means session is invalid or restricted
    // We don't redirect if it's the login request itself, so we can show "Invalid credentials"
    if ((err.response?.status === 401 || err.response?.status === 403) && !isLoginRequest) {
      useAuthStore.getState().logout()
      // Use replace to prevent navigation loops in history
      const loginPath = (import.meta.env.BASE_URL || '/pommastore/admin/').replace(/\/$/, '') + '/login'
      window.location.replace(loginPath)
    }
    return Promise.reject(err)
  }
)

export default api
