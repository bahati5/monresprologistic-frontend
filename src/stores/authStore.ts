import { create } from 'zustand'
import type { AuthUser } from '@/types'
import type { Menu, FrontendElement } from '@/types/rbac'
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
  refreshUserData: () => Promise<void>

  // RBAC helpers
  hasPermission: (code: string) => boolean
  hasAnyPermission: (codes: string[]) => boolean
  hasAllPermissions: (codes: string[]) => boolean
  hasMenuAccess: (menuCode: string) => boolean
  hasPageAccess: (pageCode: string) => boolean
  hasRouteAccess: (route: string) => boolean
  getAccessibleMenus: () => Menu[]
  getAccessiblePages: () => FrontendElement[]
}

function getAllPermissions(user: AuthUser | null): string[] {
  if (!user) return []
  const effective = user.effective_permissions ?? []
  const legacy = user.permissions ?? []
  return [...new Set([...effective, ...legacy])]
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  fetchUser: async () => {
    try {
      set({ isLoading: true })
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

  refreshUserData: async () => {
    try {
      const res = await api.get<{ user: unknown }>('/api/auth/user', {
        validateStatus: (s) => s === 200 || s === 401,
      })
      if (res.status === 200) {
        set({ user: normalizeAuthUser(res.data.user) })
      }
    } catch { /* silent */ }
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

  // ─── RBAC Helpers ─────────────────────────────

  hasPermission: (code: string) => {
    return getAllPermissions(get().user).includes(code)
  },

  hasAnyPermission: (codes: string[]) => {
    const perms = getAllPermissions(get().user)
    return codes.some((c) => perms.includes(c))
  },

  hasAllPermissions: (codes: string[]) => {
    const perms = getAllPermissions(get().user)
    return codes.every((c) => perms.includes(c))
  },

  hasMenuAccess: (menuCode: string) => {
    const menus = get().user?.accessible_menus ?? []
    return menus.some((m) => m.code === menuCode)
  },

  hasPageAccess: (pageCode: string) => {
    const pages = get().user?.accessible_pages ?? []
    return pages.some((p) => p.code === pageCode)
  },

  hasRouteAccess: (route: string) => {
    const pages = get().user?.accessible_pages ?? []
    return pages.some((p) => p.route === route)
  },

  getAccessibleMenus: () => {
    return get().user?.accessible_menus ?? []
  },

  getAccessiblePages: () => {
    return get().user?.accessible_pages ?? []
  },
}))
