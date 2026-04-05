import { useState, useMemo, useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { cn } from '@/lib/utils'
import { getNavSections, type NavSection, type SidebarNavItem } from '@/config/sidebarConfig'
import {
  Package,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Sun,
  Moon,
  Monitor,
  Menu,
  X,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePublicBranding } from '@/hooks/useSettings'
import { resolveImageUrl } from '@/lib/resolveImageUrl'

/** Largeur sidebar ouverte (px) — plus étroite qu’avant pour limiter le vide à droite des libellés */
const SIDEBAR_WIDTH_EXPANDED = 220
/** Rail icônes : assez large pour le touch, sans laisser dépasser un wordmark */
const SIDEBAR_WIDTH_COLLAPSED = 68

function SidebarFlatLink({
  item,
  collapsed,
  activeHighlightClass,
  onNavigate,
}: {
  item: SidebarNavItem
  collapsed: boolean
  activeHighlightClass: string
  onNavigate?: () => void
}) {
  return (
    <NavLink
      to={item.href}
      end={item.href === '/dashboard'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors duration-200',
          collapsed && 'justify-center px-2',
          isActive
            ? cn('font-medium', activeHighlightClass)
            : 'text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground'
        )
      }
      title={collapsed ? item.label : undefined}
    >
      <item.icon size={18} className="shrink-0 opacity-90" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  )
}

function Breadcrumb() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/')
    const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ')
    return { label, href }
  })

  return (
    <nav className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link to="/dashboard" className="hover:text-foreground transition-colors">Accueil</Link>
      {crumbs.map((c, i) => (
        <span key={c.href} className="flex items-center gap-1.5">
          <span className="text-muted-foreground/40">/</span>
          {i === crumbs.length - 1 ? (
            <span className="text-foreground font-medium">{c.label}</span>
          ) : (
            <Link to={c.href} className="hover:text-foreground transition-colors">{c.label}</Link>
          )}
        </span>
      ))}
    </nav>
  )
}

export default function SidebarLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  )
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: appSettings } = usePublicBranding()
  const [logoLoadFailed, setLogoLoadFailed] = useState(false)

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
  const effectiveLogoShown = logoSrc !== '' && !logoLoadFailed
  const showSidebarTitle = !effectiveLogoShown || showBrandBesideLogo

  const faviconUrl = resolveImageUrl(appSettings?.favicon_url as string | undefined)
  const collapsedMarkSrc =
    faviconUrl && faviconUrl.length > 0 ? faviconUrl : effectiveLogoShown ? logoSrc : ''

  /** Rail icônes uniquement sur desktop ; mobile garde toujours la barre étendue quand le menu est ouvert. */
  const isRail = collapsed && isDesktop
  const sidebarPixelWidth = isRail ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED

  useEffect(() => {
    setLogoLoadFailed(false)
  }, [logoUrlStored])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => setIsDesktop(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const navSections = useMemo(
    () => getNavSections(user?.roles || [], user?.permissions || []),
    [user?.roles, user?.permissions]
  )

  /**
   * La sidebar utilise des couleurs « marine » (clair ou sombre) : fond toujours relativement sombre,
   * donc l’état actif reste type « chip » clair sur fond sombre (lisible dans les deux thèmes globaux).
   */
  const navActiveClass = 'bg-slate-800/95 text-white shadow-sm ring-1 ring-white/10'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const themeIcon = theme === 'dark' ? <Moon size={15} /> : theme === 'light' ? <Sun size={15} /> : <Monitor size={15} />
  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'

  const closeMobile = () => setMobileOpen(false)

  const renderNavSection = (section: NavSection, index: number) => (
    <div key={section.id} className={cn(index > 0 && 'mt-5')}>
      {!isRail && (
        <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
          {section.title}
        </p>
      )}
      <div className="space-y-0.5">
        {section.items.map((item) => (
          <SidebarFlatLink
            key={item.id}
            item={item}
            collapsed={isRail}
            activeHighlightClass={navActiveClass}
            onNavigate={closeMobile}
          />
        ))}
      </div>
    </div>
  )

  const sidebarContent = (
    <div className="flex h-full min-w-0 flex-col overflow-x-hidden">
      {/* Logo : mode rail = marque seule (favicon ou logo carré), jamais le wordmark horizontal qui déborde */}
      {isRail ? (
        <div className="flex flex-col items-center gap-1 border-b border-sidebar-border px-1 py-2">
          <Link
            to="/dashboard"
            title={brandName}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-white/5"
          >
            {collapsedMarkSrc ? (
              <img
                src={collapsedMarkSrc}
                alt=""
                className="h-7 w-7 rounded-md object-contain"
                onError={() => setLogoLoadFailed(true)}
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary">
                <Package size={18} className="text-white" />
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            title="Agrandir le menu"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/50 hover:bg-white/5 hover:text-sidebar-foreground"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      ) : (
        <div className="flex h-14 min-w-0 items-center gap-1 border-b border-sidebar-border px-2.5">
          <Link to="/dashboard" className="flex min-w-0 flex-1 items-center gap-2">
            {effectiveLogoShown ? (
              <img
                src={logoSrc}
                alt=""
                className="h-8 max-h-8 w-auto max-w-[min(100px,32%)] shrink-0 object-contain object-left"
                onError={() => setLogoLoadFailed(true)}
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary">
                <Package size={18} className="text-white" />
              </div>
            )}
            {showSidebarTitle && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-w-0 truncate text-sm font-bold text-sidebar-foreground tracking-tight"
              >
                {brandName}
              </motion.span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            title="Réduire le menu"
            className="hidden shrink-0 rounded-md p-1.5 text-sidebar-foreground/50 hover:bg-white/5 hover:text-sidebar-foreground lg:block"
          >
            <ChevronLeft size={17} />
          </button>
        </div>
      )}

      {/* Navigation plate */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin p-2.5">
        {navSections.map((section, i) => renderNavSection(section, i))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2.5 space-y-2">
        <div className={cn('flex items-center gap-1', isRail ? 'flex-col' : 'gap-2')}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(nextTheme)}
            title={`Thème : ${theme}`}
            className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {themeIcon}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Déconnexion"
            className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut size={16} />
          </Button>
        </div>
        {!isRail && user && (
          <Link
            to="/profile"
            className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-sidebar-accent transition-colors"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-white">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">
                {user.roles?.[0]?.replace('_', ' ') || 'Utilisateur'}
              </p>
            </div>
          </Link>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 w-full overflow-hidden bg-background">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarPixelWidth }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-dvh max-h-dvh shrink-0 flex-col overflow-x-hidden bg-sidebar shadow-xl lg:relative lg:z-auto lg:h-full lg:max-h-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{ transition: 'transform 0.3s ease' }}
      >
        {sidebarContent}
      </motion.aside>

      {/* Main area */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>

          <Breadcrumb />

          <div className="flex-1" />

          {/* Search placeholder */}
          <button
            type="button"
            className="hidden md:flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <Search size={14} />
            <span>Rechercher...</span>
            <kbd className="ml-4 rounded border bg-background px-1.5 py-0.5 text-[10px] font-mono">
              Ctrl+K
            </kbd>
          </button>

          <Link to="/notifications">
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={18} />
            </Button>
          </Link>

          <Button variant="ghost" size="icon" onClick={() => setTheme(nextTheme)} className="hidden lg:inline-flex">
            {themeIcon}
          </Button>

          <Link to="/profile" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground ring-2 ring-primary/20">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium leading-none">{user?.name}</p>
              <p className="text-xs text-muted-foreground">
                {user?.roles?.[0]?.replace('_', ' ') || 'Utilisateur'}
              </p>
            </div>
          </Link>
        </header>

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
