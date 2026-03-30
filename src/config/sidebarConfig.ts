import {
  Home,
  PackageOpen,
  ClipboardList,
  ShoppingCart,
  Package,
  Truck,
  Plus,
  CheckCircle,
  MapPin,
  Layers,
  BoxSelect,
  DollarSign,
  FileText,
  CreditCard,
  Wallet,
  BookOpen,
  Users,
  Contact,
  Car,
  BarChart3,
  UserCog,
  Shield,
  Settings,
  Bell,
  LayoutDashboard,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
  permission?: string
  roles?: string[]
  badge?: string
  badgeColor?: 'default' | 'destructive' | 'warning' | 'success'
  isAction?: boolean
}

export interface NavGroup {
  id: string
  title: string
  icon: LucideIcon
  color: string
  collapsible: boolean
  defaultOpen?: boolean
  items: NavItem[]
  permission?: string
  roles?: string[]
}

export const ROLE_LABELS: Record<string, Record<string, string>> = {
  inbound:   { admin: 'Flux Entrants', client: 'Mes Achats' },
  shipments: { admin: 'Expeditions & Transport', client: 'Mes Expeditions', driver: 'Mes Livraisons' },
  pickups:   { admin: 'Collectes & Ramassages', client: 'Mes Collectes', driver: 'Mes Pickups' },
  finance:   { admin: 'Finance & Comptabilite', client: 'Mon Compte' },
  crm:       { admin: 'CRM & Contacts', client: 'Mes Destinataires' },
}

export function getNavGroups(userRoles: string[], userPermissions: string[]): NavGroup[] {
  const hasRole = (r: string) => userRoles.includes(r)
  const hasPerm = (p: string) => userPermissions.includes(p)
  const isAdmin = hasRole('super_admin') || hasRole('agency_admin')
  const isOperator = hasRole('operator')
  const isClient = hasRole('client')
  const isDriver = hasRole('driver')
  const isStaff = isAdmin || isOperator

  const roleKey = isClient ? 'client' : isDriver ? 'driver' : 'admin'

  const groups: NavGroup[] = []

  // Home — always visible
  groups.push({
    id: 'home',
    title: 'Accueil',
    icon: Home,
    color: '#2B4C7E',
    collapsible: false,
    items: [
      { id: 'dashboard', label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    ],
  })

  // Flux Entrants
  if (!isDriver) {
    groups.push({
      id: 'inbound',
      title: ROLE_LABELS.inbound[roleKey] || 'Flux Entrants',
      icon: PackageOpen,
      color: '#F59E0B',
      collapsible: true,
      defaultOpen: false,
      items: [
        { id: 'shipment-notices', label: 'Avis d\'expedition', href: '/shipment-notices', icon: ClipboardList },
        { id: 'purchase-orders', label: 'Ordres d\'achat', href: '/purchase-orders', icon: ShoppingCart },
        ...(isStaff ? [{ id: 'customer-packages', label: 'Colis clients', href: '/customer-packages', icon: Package }] : []),
      ],
    })
  }

  // Expeditions
  groups.push({
    id: 'shipments',
    title: ROLE_LABELS.shipments[roleKey] || 'Expeditions',
    icon: Truck,
    color: '#3B82F6',
    collapsible: true,
    defaultOpen: false,
    items: [
      { id: 'shipments-list', label: 'Toutes les expeditions', href: '/shipments', icon: Package },
      ...(!isDriver ? [{ id: 'shipments-create', label: 'Nouvelle expedition', href: '/shipments/create', icon: Plus, isAction: true }] : []),
      ...(isStaff ? [{ id: 'shipments-acceptance', label: 'Acceptation', href: '/shipments/acceptance', icon: CheckCircle }] : []),
    ],
  })

  // Pickups
  if (!(!isClient && !isDriver && !isStaff)) {
    groups.push({
      id: 'pickups',
      title: ROLE_LABELS.pickups[roleKey] || 'Ramassages',
      icon: MapPin,
      color: '#10B981',
      collapsible: true,
      items: [
        { id: 'pickups-list', label: 'Toutes les collectes', href: '/pickups', icon: Truck },
      ],
    })
  }

  // Consolidations
  if (isStaff || isDriver) {
    groups.push({
      id: 'consolidations',
      title: 'Consolidations',
      icon: Layers,
      color: '#6366F1',
      collapsible: true,
      items: [
        { id: 'consolidations-list', label: 'Consolidations', href: '/consolidations', icon: BoxSelect },
      ],
    })
  }

  // Finance
  if (!isDriver) {
    groups.push({
      id: 'finance',
      title: ROLE_LABELS.finance[roleKey] || 'Finance',
      icon: DollarSign,
      color: '#14B8A6',
      collapsible: true,
      items: [
        ...(isStaff ? [{ id: 'finance-dashboard', label: 'Dashboard', href: '/finance/dashboard', icon: BarChart3 }] : []),
        { id: 'finance-invoices', label: 'Factures', href: '/finance/invoices', icon: FileText },
        ...(isStaff ? [{ id: 'finance-proofs', label: 'Preuves de paiement', href: '/finance/payment-proofs', icon: CreditCard }] : []),
        { id: 'finance-wallets', label: 'Portefeuilles', href: '/finance/wallets', icon: Wallet },
        ...(isStaff ? [{ id: 'finance-ledger', label: 'Grand livre', href: '/finance/ledger', icon: BookOpen }] : []),
      ],
    })
  }

  // CRM
  if (isStaff || isClient) {
    const crmItems: NavItem[] = []
    if (isStaff) {
      crmItems.push({ id: 'clients', label: 'Clients', href: '/clients', icon: Users })
    }
    crmItems.push({ id: 'recipients', label: 'Destinataires', href: '/recipients', icon: Contact })
    if (isStaff) {
      crmItems.push({ id: 'drivers', label: 'Chauffeurs', href: '/drivers', icon: Car })
    }

    groups.push({
      id: 'crm',
      title: ROLE_LABELS.crm[roleKey] || 'CRM & Contacts',
      icon: Users,
      color: '#8B5CF6',
      collapsible: true,
      items: crmItems,
    })
  }

  // Reports
  if (isAdmin) {
    groups.push({
      id: 'reports',
      title: 'Rapports & Analytics',
      icon: BarChart3,
      color: '#06B6D4',
      collapsible: true,
      items: [
        { id: 'reports-dashboard', label: 'Vue d\'ensemble', href: '/reports', icon: LayoutDashboard },
      ],
    })
  }

  // Team
  if (isAdmin) {
    groups.push({
      id: 'team',
      title: 'Equipe & Utilisateurs',
      icon: UserCog,
      color: '#64748B',
      collapsible: true,
      items: [
        { id: 'users', label: 'Utilisateurs', href: '/users', icon: UserCog },
        { id: 'roles', label: 'Roles & Permissions', href: '/roles', icon: Shield },
      ],
    })
  }

  // Config
  if (isAdmin) {
    groups.push({
      id: 'config',
      title: 'Configuration',
      icon: Settings,
      color: '#64748B',
      collapsible: true,
      items: [
        { id: 'settings', label: 'Parametres', href: '/settings', icon: Settings },
      ],
    })
  }

  // Notifications — always
  groups.push({
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    color: '#2B4C7E',
    collapsible: false,
    items: [
      { id: 'notifications', label: 'Centre de notifications', href: '/notifications', icon: Bell },
    ],
  })

  return groups
}
