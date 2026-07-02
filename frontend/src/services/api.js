import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1' })

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
      window.location.replace('/admin/login')
    }
    return Promise.reject(err)
  }
)

export default api
