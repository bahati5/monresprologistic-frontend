import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { BrandingSync } from '@/components/BrandingSync'
import { router } from './router'
import { useAuthStore } from './stores/authStore'
import { useThemeStore } from './stores/themeStore'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

function AppBootstrap() {
  const { fetchUser } = useAuthStore()
  const { initTheme } = useThemeStore()

  // Boot once
  const booted = import.meta.env.SSR ? true : (window as any).__booted
  if (!booted) {
    ;(window as any).__booted = true
    fetchUser().then(() => {
      const user = useAuthStore.getState().user
      initTheme(user?.theme_preference)
    })
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrandingSync />
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppBootstrap />
  </StrictMode>,
)
