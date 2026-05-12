import { create } from 'zustand'
import type { AuthUser } from '@/types'
import api from '@/api/client'
import { normalizeAuthUser } from '@/lib/authUser'

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  fetchUser: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (
    first_name: string,
    last_name: string,
    email: string,
    phone: string,
    password: string,
    password_confirmation: string,
  ) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: AuthUser | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  fetchUser: async () => {
    try {
      set({ isLoading: true })
      // 401 = pas de session : ne pas laisser Axios rejeter (évite erreur rouge console au démarrage).
      const res = await api.get<{ user: unknown }>('/api/auth/user', {
        validateStatus: (s) => s === 200 || s === 401,
      })
      if (res.status === 401) {
        set({ user: null, isAuthenticated: false, isLoading: false })
        return
      }
      set({
        user: normalizeAuthUser(res.data.user),
        isAuthenticated: true,
        isLoading: false,
      })
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  login: async (email: string, password: string) => {
    await api.get('/sanctum/csrf-cookie')
    const raw = email.trim()
    const login = raw.includes('@') ? raw.toLowerCase() : raw.replace(/\s/g, '')
    const { data } = await api.post('/api/auth/login', {
      login,
      password,
    })
    set({ user: normalizeAuthUser(data.user), isAuthenticated: true })
  },

  register: async (
    first_name: string,
    last_name: string,
    email: string,
    phone: string,
    password: string,
    password_confirmation: string,
  ) => {
    await api.get('/sanctum/csrf-cookie')
    const { data } = await api.post('/api/auth/register', {
      first_name,
      last_name,
      email,
      phone,
      password,
      password_confirmation,
    })
    set({ user: normalizeAuthUser(data.user), isAuthenticated: true })
  },

  logout: async () => {
    await api.post('/api/auth/logout')
    set({ user: null, isAuthenticated: false })
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
}))
