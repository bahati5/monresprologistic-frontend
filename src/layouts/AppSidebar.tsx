import { Link } from 'react-router-dom'
import { LogOut, Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NavSection } from '@/config/sidebarConfig'
import { Button } from '@/components/ui/button'
import type { AuthUser } from '@/types'
import { SidebarFlatLink } from '@/layouts/SidebarFlatLink'
import { SidebarBrandHeader } from '@/layouts/SidebarBrandHeader'

export interface AppSidebarProps {
  isRail: boolean
  brandName: string
  logoSrc: string
  faviconUrl: string
  showBrandBesideLogo: boolean
  brandHeaderKey: string
  navSections: NavSection[]
  navActiveClass: string
  closeMobile: () => void
  theme: 'light' | 'dark' | 'system'
  onThemeToggle: () => void
  onExpandSidebar: () => void
  onCollapseSidebar: () => void
  onLogout: () => void
  user: AuthUser | null
}

export function AppSidebar({
  isRail,
  brandName,
  logoSrc,
  faviconUrl,
  showBrandBesideLogo,
  brandHeaderKey,
  navSections,
  navActiveClass,
  closeMobile,
  theme,
  onThemeToggle,
  onExpandSidebar,
  onCollapseSidebar,
  onLogout,
  user,
}: AppSidebarProps) {
  const themeIcon =
    theme === 'dark' ? <Moon size={15} /> : theme === 'light' ? <Sun size={15} /> : <Monitor size={15} />

  const renderNavSection = (section: NavSection, index: number) => (
    <div key={section.id} className={cn(index > 0 && 'mt-5')}>
      {!isRail ? (
        <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
          {section.title}
        </p>
      ) : null}
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

  return (
    <div className="flex h-full min-w-0 flex-col overflow-x-hidden">
      <SidebarBrandHeader
        key={brandHeaderKey}
        isRail={isRail}
        brandName={brandName}
        logoSrc={logoSrc}
        faviconUrl={faviconUrl}
        showBrandBesideLogo={showBrandBesideLogo}
        onExpandSidebar={onExpandSidebar}
        onCollapseSidebar={onCollapseSidebar}
      />

      <nav className="flex-1 overflow-y-auto scrollbar-thin p-2.5">
        {navSections.map((section, i) => renderNavSection(section, i))}
      </nav>

      <div className="border-t border-sidebar-border p-2.5 space-y-2">
        <div className={cn('flex items-center gap-1', isRail ? 'flex-col' : 'gap-2')}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onThemeToggle}
            title={`Thème : ${theme}`}
            className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {themeIcon}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            title="Déconnexion"
            className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut size={16} />
          </Button>
        </div>
        {!isRail && user ? (
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
        ) : null}
      </div>
    </div>
  )
}
