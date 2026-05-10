import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Package, ShoppingBag, Box, Receipt, User, LayoutDashboard, Bell, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

const clientNav = [
  { href: '/portal', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/portal/expeditions', label: 'Mes expéditions', icon: Package },
  { href: '/portal/achats', label: 'Mes achats', icon: ShoppingBag },
  { href: '/portal/casier', label: 'Mon casier', icon: Box },
  { href: '/portal/factures', label: 'Mes factures', icon: Receipt },
  { href: '/portal/paiement', label: 'Paiements', icon: CreditCard },
  { href: '/portal/profil', label: 'Mon profil', icon: User },
]

export default function ClientPortalLayout() {
  const { user } = useAuthStore()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-5xl flex items-center justify-between h-14 px-4">
          <Link to="/portal" className="font-bold text-lg">
            Monrespro
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/notifications" className="relative p-2 hover:bg-muted rounded-lg transition-colors">
              <Bell className="h-5 w-5" />
            </Link>
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.name}</span>
          </div>
        </div>
      </header>

      <nav className="border-b bg-muted/30 overflow-x-auto">
        <div className="mx-auto max-w-5xl flex px-4">
          {clientNav.map(item => {
            const isActive = location.pathname === item.href || (item.href !== '/portal' && location.pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
