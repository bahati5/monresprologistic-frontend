import { create } from 'zustand'
import api from '@/api/client'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  initTheme: (preference?: Theme) => void
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'system',

  initTheme: (preference?: Theme) => {
    const t = preference || (localStorage.getItem('theme') as Theme) || 'system'
    applyTheme(t)
    set({ theme: t })
  },

  setTheme: async (theme: Theme) => {
    applyTheme(theme)
    localStorage.setItem('theme', theme)
    set({ theme })
    try {
      await api.patch('/api/theme', { theme_preference: theme })
    } catch {
      // silent fail
    }
  },
}))
