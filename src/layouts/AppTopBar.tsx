import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Menu, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarBreadcrumb } from '@/layouts/SidebarBreadcrumb'
import type { AuthUser } from '@/types'

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

      <Link to="/notifications">
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={18} />
        </Button>
      </Link>

      <Button variant="ghost" size="icon" onClick={onThemeCycle} className="hidden lg:inline-flex">
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
  )
}
