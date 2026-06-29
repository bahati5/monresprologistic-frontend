import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Menu, Search, X, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarBreadcrumb } from '@/layouts/SidebarBreadcrumb'
import type { AuthUser } from '@/types'
import { useAuthStore } from '@/stores/authStore'
import { isPortalOnlyClient } from '@/lib/internalAppRoles'
import { useUnreadCount } from '@/hooks/useCrm'

export function AppTopBar({
  mobileOpen,
  onToggleMobile,
  themeIcon,
  onThemeCycle,
  user,
}: {
  mobileOpen: boolean
  onToggleMobile: () => void
  themeIcon: ReactNode
  onThemeCycle: () => void
  user: AuthUser | null
}) {
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const { data: unreadCount = 0 } = useUnreadCount()
  const isClient = isPortalOnlyClient(user)
  const notificationsTo = isClient ? '/portal/notifications' : '/notifications'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6 shadow-sm">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onToggleMobile}>
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      <SidebarBreadcrumb />

      <div className="flex-1" />

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

      <Link to={notificationsTo} className="relative inline-flex">
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={18} />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </Button>
      </Link>

      <Button variant="ghost" size="icon" onClick={onThemeCycle} className="hidden lg:inline-flex">
        {themeIcon}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => void handleLogout()}
        aria-label="Déconnexion"
        title="Déconnexion"
      >
        <LogOut size={18} />
      </Button>

      <Link to="/profile" className="flex min-w-0 items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground ring-2 ring-primary/20">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="hidden min-w-0 lg:block">
          <p className="truncate text-sm font-medium leading-none">{user?.name}</p>
          <p className="text-xs text-muted-foreground">
            {user?.roles?.[0]?.replace('_', ' ') || 'Utilisateur'}
          </p>
        </div>
      </Link>
    </header>
  )
}
