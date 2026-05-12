import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { SidebarNavItem } from '@/config/sidebarConfig'
import { isNavHrefActive } from '@/lib/navActiveMatch'

export function SidebarFlatLink({
  item,
  collapsed,
  activeHighlightClass,
  activeNavHref,
  onNavigate,
}: {
  item: SidebarNavItem
  collapsed: boolean
  activeHighlightClass: string
  /** Href unique « actif » pour la route courante (plus long préfixe parmi tout le menu) */
  activeNavHref: string | null
  onNavigate?: () => void
}) {
  const isActive = isNavHrefActive(item.href, activeNavHref)

  return (
    <Link
      to={item.href}
      aria-current={isActive ? 'page' : undefined}
      onClick={onNavigate}
      className={cn(
        'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors duration-200',
        collapsed && 'justify-center px-2',
        isActive
          ? cn('font-medium', activeHighlightClass)
          : 'text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground',
      )}
      title={collapsed ? item.label : undefined}
    >
      <item.icon size={18} className="shrink-0 opacity-90" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )
}
