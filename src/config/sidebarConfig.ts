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
  type LucideIcon,
} from 'lucide-react'

export interface SidebarNavItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
  /** L’utilisateur doit avoir au moins un de ces rôles */
  rolesAny?: string[]
  /** Masqué si l’utilisateur a l’un de ces rôles */
  rolesNone?: string[]
  /** Permission requise (Spatie) */
  permission?: string
}

export interface NavSection {
  id: string
  title: string
  items: SidebarNavItem[]
}

const STAFF_ROLES = ['super_admin', 'agency_admin', 'operator'] as const

const SECTIONS: NavSection[] = [
  {
    id: 'general',
    title: 'GÉNÉRAL',
    items: [
      { id: 'dashboard', label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    id: 'client-services',
    title: 'SERVICES CLIENTS',
    items: [
      {
        id: 'shopping-assisted',
        label: 'Shopping Assisté',
        href: '/purchase-orders',
        icon: ShoppingBag,
        rolesNone: ['driver'],
      },
      {
        id: 'quote-dashboard',
        label: 'Suivi devis',
        href: '/purchase-orders/suivi',
        icon: ClipboardList,
        rolesAny: ['super_admin', 'agency_admin', 'operator'],
      },
      {
        id: 'expected-packages',
        label: 'Colis Attendus',
        href: '/shipment-notices',
        icon: BellRing,
        rolesNone: ['driver'],
      },
    ],
  },
  {
    id: 'operations',
    title: 'OPÉRATIONS',
    items: [
      { id: 'shipments', label: 'Expéditions', href: '/shipments', icon: Package },
      {
        id: 'consolidations',
        label: 'Regroupements',
        href: '/regroupements',
        icon: Layers,
        rolesAny: [...STAFF_ROLES, 'driver'],
      },
      { id: 'pickups', label: 'Ramassages', href: '/pickups', icon: Truck },
    ],
  },
  {
    id: 'crm-finance',
    title: 'CRM & FINANCE',
    items: [
      {
        id: 'clients-directory',
        label: 'Annuaire Clients',
        href: '/clients',
        icon: Users,
        rolesAny: [...STAFF_ROLES],
      },
      {
        id: 'billing',
        label: 'Facturation',
        href: '/finance/invoices',
        icon: Receipt,
        rolesNone: ['driver'],
      },
      {
        id: 'accounting',
        label: 'Comptabilité',
        href: '/finance/ledger',
        icon: BookOpen,
        permission: 'manage_finances',
      },
    ],
  },
  {
    id: 'analytics',
    title: 'ANALYTIQUE',
    items: [
      {
        id: 'analytics-dashboard',
        label: 'Tableaux de bord',
        href: '/analytics',
        icon: BarChart3,
        permission: 'view_analytics',
      },
      {
        id: 'analytics-assisted-purchase',
        label: 'Achat assisté',
        href: '/analytics/achat-assiste',
        icon: TrendingUp,
        rolesAny: ['super_admin', 'agency_admin', 'operator'],
      },
    ],
  },
  {
    id: 'administration',
    title: 'ADMINISTRATION',
    items: [
      {
        id: 'team-roles',
        label: 'Équipe & Rôles',
        href: '/users',
        icon: Shield,
        rolesAny: ['super_admin', 'agency_admin'],
      },
      {
        id: 'settings',
        label: 'Paramètres',
        href: '/settings',
        icon: Settings,
        rolesAny: ['super_admin', 'agency_admin'],
      },
    ],
  },
]

export function isSidebarItemVisible(
  item: SidebarNavItem,
  userRoles: string[],
  userPermissions: string[]
): boolean {
  if (item.rolesNone?.some((r) => userRoles.includes(r))) {
    return false
  }
  if (item.rolesAny?.length && !item.rolesAny.some((r) => userRoles.includes(r))) {
    return false
  }
  if (item.permission && !userPermissions.includes(item.permission)) {
    return false
  }
  return true
}

/** Navigation plate par sections (sans accordéons). */
export function getNavSections(
  userRoles: string[],
  userPermissions: string[]
): NavSection[] {
  const isClient = userRoles.includes('client') && !userRoles.includes('driver')

  return SECTIONS.map((section) => ({
    ...section,
    items: section.items
      .filter((item) => isSidebarItemVisible(item, userRoles, userPermissions))
      .map((item) => {
        if (item.id === 'shopping-assisted' && isClient) {
          return { ...item, href: '/shopping-assiste/nouveau' }
        }
        return item
      }),
  })).filter((section) => section.items.length > 0)
}
