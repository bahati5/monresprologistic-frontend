/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { registerSW } from 'virtual:pwa-register'
import { BrandingSync } from '@/components/BrandingSync'
import { router } from './router'
import { useAuthStore } from './stores/authStore'
import { useThemeStore } from './stores/themeStore'
import './index.css'

// §21.7 — Enregistrement automatique du service worker PWA
if (import.meta.env.PROD) {
  registerSW({ immediate: true })
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

let appBootstrapStarted = false

function AppBootstrap() {
  const { fetchUser } = useAuthStore()
  const { initTheme } = useThemeStore()

  useEffect(() => {
    if (import.meta.env.SSR) return
    if (appBootstrapStarted) return
    appBootstrapStarted = true
    void fetchUser().then(() => {
      const user = useAuthStore.getState().user
      initTheme(user?.theme_preference)
    })
  }, [fetchUser, initTheme])

  return (
    <QueryClientProvider client={queryClient}>
      <BrandingSync />
      <RouterProvider
        router={router}
        future={{
          v7_startTransition: true,
        }}
      />
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppBootstrap />
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Silent fail in unsupported/blocked environments
    })
  })
}
