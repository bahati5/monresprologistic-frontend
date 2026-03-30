import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    if (error.response?.status === 419) {
      // CSRF token expired — refresh and retry
      return api.get('/sanctum/csrf-cookie').then(() => api.request(error.config))
    }
    return Promise.reject(error)
  }
)

export default api
