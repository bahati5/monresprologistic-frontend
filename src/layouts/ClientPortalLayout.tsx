import { Outlet, Link, useLocation } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Package, ShoppingBag, Box, Receipt, User, LayoutDashboard, Bell, CreditCard, HeadphonesIcon, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isNavHrefActive, resolveActiveNavHref } from '@/lib/navActiveMatch'

const clientNav = [
  { href: '/portal', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/portal/expeditions', label: 'Mes expéditions', icon: Package },
  { href: '/portal/achats', label: 'Mes achats', icon: ShoppingBag },
  { href: '/portal/casier', label: 'Mon casier', icon: Box },
  { href: '/portal/factures', label: 'Mes factures', icon: Receipt },
  { href: '/portal/sav', label: 'SAV', icon: HeadphonesIcon },
  { href: '/portal/paiement', label: 'Paiements', icon: CreditCard },
  { href: '/portal/profil', label: 'Mon profil', icon: User },
]

export default function ClientPortalLayout() {
  const { user } = useAuthStore()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const clientNavHrefs = useMemo(() => clientNav.map((i) => i.href), [])
  const activeNavHref = useMemo(
    () => resolveActiveNavHref(location.pathname, clientNavHrefs),
    [location.pathname, clientNavHrefs],
  )

  const renderNavLink = (item: (typeof clientNav)[number], display: 'drawer' | 'tabs') => {
    const isActive = isNavHrefActive(item.href, activeNavHref)

    return (
      <Link
        key={item.href}
        to={item.href}
        aria-current={isActive ? 'page' : undefined}
        onClick={display === 'drawer' ? () => setMobileOpen(false) : undefined}
        className={cn(
          display === 'drawer'
            ? 'flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors'
            : 'flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
          isActive
            ? display === 'drawer'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'border-primary text-primary'
            : display === 'drawer'
              ? 'text-muted-foreground hover:bg-muted hover:text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
        )}
      >
        <item.icon className={cn('shrink-0', display === 'drawer' ? 'h-5 w-5' : 'h-4 w-4')} />
        <span className={display === 'tabs' ? 'hidden sm:inline' : undefined}>{item.label}</span>
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted md:hidden"
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/portal" className="truncate text-lg font-bold">
              Monrespro
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/notifications" className="relative rounded-lg p-2 transition-colors hover:bg-muted" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Link>
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.name}</span>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/45 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col border-r bg-background shadow-xl transition-transform duration-300 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Navigation portail client"
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Link to="/portal" className="font-bold">
            Monrespro
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted"
            aria-label="Fermer le menu"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {clientNav.map((item) => renderNavLink(item, 'drawer'))}
        </nav>
      </aside>

      <nav className="hidden border-b bg-muted/30 overflow-x-auto md:block" aria-label="Navigation portail client">
        <div className="mx-auto max-w-5xl flex px-4">
          {clientNav.map((item) => renderNavLink(item, 'tabs'))}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-4 sm:py-6">
        <Outlet />
      </main>
    </div>
  )
}
