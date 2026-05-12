import { useMemo } from 'react'
import { useAuthStore } from '@/stores/authStore'
import type { FrontendElement, Menu } from '@/types/rbac'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  ShoppingBag,
  BellRing,
  Package,
  Layers,
  Truck,
  Users,
  Receipt,
  BookOpen,
  Shield,
  Settings,
  BarChart3,
  ClipboardList,
  TrendingUp,
  RotateCcw,
  Lock,
  UserCircle,
  KeyRound,
  Navigation,
  History,
  ScrollText,
  HeadphonesIcon,
  DollarSign,
  Eye,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  ShoppingBag,
  BellRing,
  Package,
  Layers,
  Truck,
  Users,
  Receipt,
  BookOpen,
  Shield,
  Settings,
  BarChart3,
  ClipboardList,
  TrendingUp,
  RotateCcw,
  Lock,
  UserCircle,
  KeyRound,
  Navigation,
  History,
  ScrollText,
  HeadphonesIcon,
  DollarSign,
  Eye,
}

export interface NavigationPage {
  uuid: string
  code: string
  name: string
  route: string
  icon: LucideIcon
  order: number
  permissions: string[]
}

export interface NavigationSection {
  uuid: string
  code: string
  title: string
  icon: LucideIcon
  order: number
  items: NavigationPage[]
}

function resolveIcon(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return Package
  return ICON_MAP[iconName] ?? Package
}

function buildNavigationTree(menus: Menu[], pages: FrontendElement[]): NavigationSection[] {
  const menuMap = new Map(menus.map((m) => [m.code, m]))

  const sections: NavigationSection[] = []

  const sortedMenus = [...menus].sort((a, b) => a.order - b.order)

  for (const menu of sortedMenus) {
    const menuPages = pages
      .filter((p) => p.menu?.code === menu.code && p.display_in_sidebar && p.is_page && p.is_active)
      .sort((a, b) => a.order - b.order)
      .map((p) => ({
        uuid: p.uuid,
        code: p.code,
        name: p.name,
        route: p.route,
        icon: resolveIcon(p.icon),
        order: p.order,
        permissions: p.permissions,
      }))

    if (menuPages.length > 0) {
      sections.push({
        uuid: menu.uuid,
        code: menu.code,
        title: menu.name.toUpperCase(),
        icon: resolveIcon(menu.icon),
        order: menu.order,
        items: menuPages,
      })
    }
  }

  const orphanPages = pages
    .filter((p) => !p.menu && p.display_in_sidebar && p.is_page && p.is_active)
    .sort((a, b) => a.order - b.order)
    .map((p) => ({
      uuid: p.uuid,
      code: p.code,
      name: p.name,
      route: p.route,
      icon: resolveIcon(p.icon),
      order: p.order,
      permissions: p.permissions,
    }))

  if (orphanPages.length > 0) {
    sections.push({
      uuid: 'orphan',
      code: 'other',
      title: 'AUTRE',
      icon: Package,
      order: 999,
      items: orphanPages,
    })
  }

  return sections
}

export function useNavigation(): NavigationSection[] {
  const accessibleMenus = useAuthStore((s) => s.getAccessibleMenus())
  const accessiblePages = useAuthStore((s) => s.getAccessiblePages())

  return useMemo(
    () => buildNavigationTree(accessibleMenus, accessiblePages),
    [accessibleMenus, accessiblePages],
  )
}

export { ICON_MAP, resolveIcon }
