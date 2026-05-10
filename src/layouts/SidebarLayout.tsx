import { useState, useMemo, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { cn } from '@/lib/utils'
import { getNavSections } from '@/config/sidebarConfig'
import { usePublicBranding } from '@/hooks/useSettings'
import { resolveImageUrl } from '@/lib/resolveImageUrl'
import { AppSidebar } from '@/layouts/AppSidebar'
import { AppTopBar } from '@/layouts/AppTopBar'
import { MobileSidebarOverlay } from '@/layouts/MobileSidebarOverlay'
import { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED } from '@/layouts/sidebarLayoutConstants'

export default function SidebarLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  )
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: appSettings } = usePublicBranding()

  const brandName = (() => {
    const hub = String(appSettings?.hub_brand_name ?? '').trim()
    const site = String(appSettings?.site_name ?? '').trim()
    return hub || site || 'Monrespro'
  })()

  const logoUrlStored = appSettings?.logo_url
  const logoSrc =
    logoUrlStored != null && String(logoUrlStored).trim() !== ''
      ? resolveImageUrl(String(logoUrlStored))
      : ''
  const showBrandBesideLogo = appSettings?.show_sidebar_brand_with_logo !== false

  const faviconUrl = String(resolveImageUrl(appSettings?.favicon_url as string | undefined) ?? '')
  const brandHeaderKey = `${String(logoUrlStored ?? '')}|${String(appSettings?.favicon_url ?? '')}`

  const isRail = collapsed && isDesktop
  const sidebarPixelWidth = isRail ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => setIsDesktop(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const navSections = useMemo(
    () => getNavSections(user?.roles || [], user?.permissions || []),
    [user?.roles, user?.permissions],
  )

  const navActiveClass = 'bg-slate-800/95 text-white shadow-sm ring-1 ring-white/10'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const themeIcon = theme === 'dark' ? <Moon size={15} /> : theme === 'light' ? <Sun size={15} /> : <Monitor size={15} />
  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'

  const closeMobile = () => setMobileOpen(false)

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 w-full overflow-hidden bg-background">
      <MobileSidebarOverlay open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <motion.aside
        animate={{ width: sidebarPixelWidth }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-dvh max-h-dvh shrink-0 flex-col overflow-x-hidden bg-sidebar shadow-xl lg:relative lg:z-auto lg:h-full lg:max-h-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        style={{ transition: 'transform 0.3s ease' }}
      >
        <AppSidebar
          isRail={isRail}
          brandName={brandName}
          logoSrc={logoSrc}
          faviconUrl={faviconUrl}
          showBrandBesideLogo={showBrandBesideLogo}
          brandHeaderKey={brandHeaderKey}
          navSections={navSections}
          navActiveClass={navActiveClass}
          closeMobile={closeMobile}
          theme={theme}
          onThemeToggle={() => setTheme(nextTheme)}
          onExpandSidebar={() => setCollapsed(false)}
          onCollapseSidebar={() => setCollapsed(true)}
          onLogout={handleLogout}
          user={user}
        />
      </motion.aside>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
        <AppTopBar
          mobileOpen={mobileOpen}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
          themeIcon={themeIcon}
          onThemeCycle={() => setTheme(nextTheme)}
          user={user}
        />

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 lg:p-6 scrollbar-thin"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
