import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Truck,
  Users,
  Receipt,
  BookOpen,
  Shield,
  Settings,
  BarChart3,
  TrendingUp,
  Navigation,
  History,
  HeadphonesIcon,
  DollarSign,
  Eye,
  type LucideIcon,
} from 'lucide-react'

export interface SidebarNavItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
  /** Masqué si l'utilisateur n'a aucune de ces permissions */
  permissionsAny?: string[]
}

export interface NavSection {
  id: string
  title: string
  items: SidebarNavItem[]
}

const SECTIONS: NavSection[] = [
  {
    id: 'general',
    title: 'GÉNÉRAL',
    items: [
      { id: 'dashboard', label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    id: 'services-clients',
    title: 'SERVICES CLIENTS',
    items: [
      {
        id: 'shopping-assisted',
        label: 'Shopping Assisté',
        href: '/purchase-orders',
        icon: ShoppingBag,
        permissionsAny: ['assisted_purchase.manage'],
      },
      {
        id: 'suivi-sav',
        label: 'SAV',
        href: '/sav',
        icon: HeadphonesIcon,
        permissionsAny: ['sav.view', 'sav.manage'],
      },
    ],
  },
  {
    id: 'suivi',
    title: 'SUIVI',
    items: [
      {
        id: 'suivi-dashboard',
        label: 'Tableau de suivi',
        href: '/monitoring',
        icon: Eye,
        permissionsAny: ['suivi.view'],
      },
    ],
  },
  {
    id: 'operations',
    title: 'OPÉRATIONS',
    items: [
      {
        id: 'shipments',
        label: 'Expéditions',
        href: '/shipments',
        icon: Package,
        permissionsAny: ['shipments.view'],
      },
      {
        id: 'consolidations',
        label: 'Regroupements',
        href: '/regroupements',
        icon: Layers,
        permissionsAny: ['operations.view_regroupements', 'operations.manage_regroupements'],
      },
      {
        id: 'pickups',
        label: 'Ramassages',
        href: '/pickups',
        icon: Truck,
        permissionsAny: ['operations.manage_pickups'],
      },
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
        permissionsAny: ['crm.view', 'crm.manage'],
      },
      {
        id: 'billing',
        label: 'Facturation',
        href: '/finance/invoices',
        icon: Receipt,
        permissionsAny: ['finance.view_payments', 'finance.manage'],
      },
      {
        id: 'accounting',
        label: 'Comptabilité',
        href: '/finance/ledger',
        icon: BookOpen,
        permissionsAny: ['finance.manage'],
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
        permissionsAny: ['analytics.view'],
      },
      {
        id: 'analytics-assisted-purchase',
        label: 'Achat assisté',
        href: '/analytics/achat-assiste',
        icon: TrendingUp,
        permissionsAny: ['analytics.view'],
      },
      {
        id: 'analytics-shipments',
        label: 'Expéditions',
        href: '/analytics/expeditions',
        icon: Package,
        permissionsAny: ['analytics.view'],
      },
      {
        id: 'analytics-sav',
        label: 'SAV',
        href: '/analytics/sav',
        icon: HeadphonesIcon,
        permissionsAny: ['analytics.view'],
      },
      {
        id: 'analytics-finance',
        label: 'Finance',
        href: '/analytics/finance',
        icon: DollarSign,
        permissionsAny: ['analytics.view'],
      },
    ],
  },
  {
    id: 'users-module',
    title: 'UTILISATEURS',
    items: [
      {
        id: 'users-management',
        label: 'Gestion utilisateurs',
        href: '/users',
        icon: Users,
        permissionsAny: ['rbac.manage_users'],
      },
      {
        id: 'users-roles',
        label: 'Rôles',
        href: '/users/roles',
        icon: Shield,
        permissionsAny: ['rbac.manage_roles', 'rbac.view_roles'],
      },
      {
        id: 'users-navigation',
        label: 'Navigation',
        href: '/users/navigation',
        icon: Navigation,
        permissionsAny: ['rbac.manage_menus'],
      },
      {
        id: 'users-activity-log',
        label: 'Journal d\'activité',
        href: '/users/activity-log',
        icon: History,
        permissionsAny: ['rbac.manage_users'],
      },
    ],
  },
  {
    id: 'administration',
    title: 'ADMINISTRATION',
    items: [
      {
        id: 'settings',
        label: 'Paramètres',
        href: '/settings',
        icon: Settings,
        permissionsAny: ['admin.manage_settings', 'admin.manage_pricing', 'admin.manage_agencies'],
      },
    ],
  },
]

export function isSidebarItemVisible(
  item: SidebarNavItem,
  _userRoles: string[],
  userPermissions: string[]
): boolean {
  if (item.permissionsAny?.length && !item.permissionsAny.some((p) => userPermissions.includes(p))) {
    return false
  }
  return true
}

export function getNavSections(
  userRoles: string[],
  userPermissions: string[]
): NavSection[] {
  return SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => isSidebarItemVisible(item, userRoles, userPermissions)),
  })).filter((section) => section.items.length > 0)
}
