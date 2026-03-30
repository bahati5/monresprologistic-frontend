import { create } from 'zustand'
import type { AuthUser } from '@/types'
import api from '@/api/client'

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  fetchUser: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, password_confirmation: string) => Promise<void>
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
      const { data } = await api.get('/api/auth/user')
      set({ user: data.user, isAuthenticated: true, isLoading: false })
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  login: async (email: string, password: string) => {
    await api.get('/sanctum/csrf-cookie')
    const { data } = await api.post('/api/auth/login', { email, password })
    set({ user: data.user, isAuthenticated: true })
  },

  register: async (name: string, email: string, password: string, password_confirmation: string) => {
    await api.get('/sanctum/csrf-cookie')
    const { data } = await api.post('/api/auth/register', { name, email, password, password_confirmation })
    set({ user: data.user, isAuthenticated: true })
  },

  logout: async () => {
    await api.post('/api/auth/logout')
    set({ user: null, isAuthenticated: false })
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
}))
