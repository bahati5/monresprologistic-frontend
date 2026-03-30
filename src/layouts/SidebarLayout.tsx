import { useState, useMemo } from 'react'
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { cn } from '@/lib/utils'
import { getNavGroups, type NavGroup, type NavItem } from '@/config/sidebarConfig'
import {
  Package,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bell,
  Sun,
  Moon,
  Monitor,
  Menu,
  X,
  Search,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

function SidebarGroupItem({
  group,
  collapsed,
  isExpanded,
  onToggle,
}: {
  group: NavGroup
  collapsed: boolean
  isExpanded: boolean
  onToggle: () => void
}) {
  const location = useLocation()
  const isGroupActive = group.items.some(
    (item) => location.pathname === item.href || location.pathname.startsWith(item.href + '/')
  )

  if (!group.collapsible) {
    return (
      <div className="space-y-0.5">
        {group.items.map((item) => (
          <SidebarNavLink key={item.id} item={item} collapsed={collapsed} groupColor={group.color} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold uppercase tracking-wider transition-colors',
          'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
          collapsed && 'justify-center px-2',
          isGroupActive && 'text-sidebar-foreground'
        )}
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: group.color + '20' }}
        >
          <group.icon size={15} style={{ color: group.color }} />
        </div>
        {!collapsed && (
          <>
            <span className="flex-1 text-left truncate">{group.title}</span>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={14} className="opacity-50" />
            </motion.div>
          </>
        )}
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && !collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="ml-5 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
              {group.items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                >
                  <SidebarNavLink item={item} collapsed={false} groupColor={group.color} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SidebarNavLink({
  item,
  collapsed,
  groupColor,
}: {
  item: NavItem
  collapsed: boolean
  groupColor: string
}) {
  return (
    <NavLink
      to={item.href}
      end={item.href === '/dashboard'}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
          item.isAction
            ? 'font-medium text-white hover:brightness-110'
            : isActive
              ? 'bg-sidebar-accent text-sidebar-foreground font-medium'
              : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
          collapsed && 'justify-center px-2'
        )
      }
      style={({ isActive }) =>
        item.isAction
          ? { backgroundColor: groupColor }
          : isActive
            ? { borderLeft: `3px solid ${groupColor}` }
            : {}
      }
      title={collapsed ? item.label : undefined}
    >
      <item.icon size={18} className="shrink-0" />
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
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['shipments'])
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const navigate = useNavigate()
  const location = useLocation()

  const navGroups = useMemo(
    () => getNavGroups(user?.roles || [], user?.permissions || []),
    [user?.roles, user?.permissions]
  )

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    )
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const themeIcon = theme === 'dark' ? <Moon size={16} /> : theme === 'light' ? <Sun size={16} /> : <Monitor size={16} />
  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary">
            <Package size={20} className="text-white" />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-bold text-sidebar-foreground tracking-tight"
            >
              Monrespro
            </motion.span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto hidden text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors lg:block"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin space-y-1 p-3">
        {navGroups.map((group) => (
          <SidebarGroupItem
            key={group.id}
            group={group}
            collapsed={collapsed}
            isExpanded={expandedGroups.includes(group.id)}
            onToggle={() => toggleGroup(group.id)}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        <div className={cn('flex items-center gap-1', collapsed ? 'flex-col' : 'gap-2')}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(nextTheme)}
            title={`Theme: ${theme}`}
            className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {themeIcon}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Deconnexion"
            className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut size={16} />
          </Button>
        </div>
        {!collapsed && user && (
          <Link
            to="/profile"
            className="flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent transition-colors"
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
    <div className="flex h-screen overflow-hidden bg-background">
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
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex-shrink-0 bg-sidebar shadow-xl lg:relative lg:z-auto',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{ transition: 'transform 0.3s ease' }}
      >
        {sidebarContent}
      </motion.aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
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
          <button className="hidden md:flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors">
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

        {/* Page content with animation */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="p-4 lg:p-6"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
