import axios from 'axios'

/**
 * En `vite` (DEV), baseURL vide : les appels vont sur la même origine que le SPA et le proxy
 * Vite transmet `/api` et `/sanctum` vers Laravel. Sinon le cookie XSRF sur :8000 n’est pas
 * lisible depuis la page :5173 et Sanctum échoue (souvent sans requête utile côté serveur).
 */
const baseURL = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

const api = axios.create({
  baseURL,
  withCredentials: true,
  withXSRFToken: true,
  timeout: 30_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

/** Ne pas rediriger : session absente attendue pour savoir si l'utilisateur est connecté. */
const AUTH_SILENT_401 = ['/api/auth/user']

function shouldRedirectOn401(url: string | undefined): boolean {
  if (!url) return false
  if (AUTH_SILENT_401.some((p) => url.includes(p))) return false
  if (url.includes('/api/auth/login') || url.includes('/api/auth/register')) return false
  if (url.includes('/sanctum/csrf-cookie')) return false
  return true
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''

    // Ne pas rediriger la fenetre principale si l’echec concerne un PDF telecharge en blob
    // (sinon un 401 sur le document peut deconnecter l’utilisateur alors qu’il reste sur la page).
    if (
      status === 401 &&
      shouldRedirectOn401(url) &&
      error.config?.responseType !== 'blob'
    ) {
      const path = window.location.pathname
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        window.location.href = '/login'
      }
    }

    if (status === 419 && error.config && !(error.config as { _csrfRetried?: boolean })._csrfRetried) {
      ;(error.config as { _csrfRetried?: boolean })._csrfRetried = true
      return api.get('/sanctum/csrf-cookie').then(() => api.request(error.config))
    }

    return Promise.reject(error)
  }
)

export default api
