/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Link, Navigate } from 'react-router-dom'
import { displayLocalized } from '@/lib/localizedString'
import { lazy, Suspense, type ComponentType } from 'react'
import RequireAuth from '@/components/auth/RequireAuth'
import GuestOnly from '@/components/auth/GuestOnly'
import ClientPortalOnly from '@/components/auth/ClientPortalOnly'
import SidebarLayout from '@/layouts/SidebarLayout'
import ProtectedRoute from '@/components/rbac/ProtectedRoute'
import GenericListPage from '@/pages/GenericListPage'

type ListRow = Record<string, unknown>

function readNestedName(obj: unknown): unknown {
  if (obj && typeof obj === 'object' && 'name' in obj) return (obj as { name: unknown }).name
  return undefined
}

function makeLazyRoute(factory: () => Promise<{ default: ComponentType }>) {
  const LazyPage = lazy(factory)
  function LazyRoute() {
    return (
      <Suspense fallback={<Loader />}>
        <LazyPage />
      </Suspense>
    )
  }
  return LazyRoute
}

const Loader = () => (
  <div className="flex h-64 items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
)

// Auth
const Login = makeLazyRoute(() => import('@/pages/auth/Login'))
const Register = makeLazyRoute(() => import('@/pages/auth/Register'))
const PublicTrackingPage = makeLazyRoute(() => import('@/pages/public/PublicTrackingPage'))
const AssistedPurchasePublicPage = makeLazyRoute(() => import('@/pages/public/AssistedPurchasePublicPage'))
const QuoteResponsePage = makeLazyRoute(() => import('@/pages/public/QuoteResponsePage'))

// Core
const Dashboard = makeLazyRoute(() => import('@/pages/Dashboard'))
const Profile = makeLazyRoute(() => import('@/pages/Profile'))

// Shipments
const ShipmentsList = makeLazyRoute(() => import('@/pages/shipments/ShipmentsList'))
const ShipmentDetail = makeLazyRoute(() => import('@/pages/shipments/ShipmentDetail'))
const ShipmentCreate = makeLazyRoute(() => import('@/pages/shipments/ShipmentCreate'))

// Operations
const PickupsPage = makeLazyRoute(() => import('@/pages/operations/PickupsPage'))
const RegroupementsPage = makeLazyRoute(() => import('@/pages/operations/RegroupementsPage'))

// Finance
const FinanceDashboardPage = makeLazyRoute(() => import('@/pages/finance/FinanceDashboardPage'))

// CRM
const ClientsPage = makeLazyRoute(() => import('@/pages/crm/ClientsPage'))
const ClientDetailPage = makeLazyRoute(() => import('@/pages/crm/ClientDetailPage'))
const UsersPage = makeLazyRoute(() => import('@/pages/crm/UsersPage'))
const DriversPage = makeLazyRoute(() => import('@/pages/crm/DriversPage'))

// Reports
const ReportsHub = makeLazyRoute(() => import('@/pages/reports/ReportsHub'))

// Settings
const SettingsHub = makeLazyRoute(() => import('@/pages/settings/SettingsHub'))

// RBAC Admin (module Utilisateurs)
const RbacRolesPage = makeLazyRoute(() => import('@/pages/settings/rbac/RbacRolesPage'))
const RbacNavigationPage = makeLazyRoute(() => import('@/pages/settings/rbac/RbacNavigationPage'))
const UserActivityLogPage = makeLazyRoute(() => import('@/pages/admin/UserActivityLogPage'))

// New pages
const RefundsPage = makeLazyRoute(() => import('@/pages/finance/RefundsPage'))
const AnalyticsDashboard = makeLazyRoute(() => import('@/pages/analytics/AnalyticsDashboard'))
const OverdueDashboardPage = makeLazyRoute(() => import('@/pages/analytics/OverdueDashboardPage'))
const QuoteConversionPage = makeLazyRoute(() => import('@/pages/analytics/QuoteConversionPage'))
const ClientDashboard = makeLazyRoute(() => import('@/pages/portal/ClientDashboard'))
const ClientLockerPage = makeLazyRoute(() => import('@/pages/portal/ClientLockerPage'))
const ClientInvoicesPage = makeLazyRoute(() => import('@/pages/portal/ClientInvoicesPage'))
const FlexPayPage = makeLazyRoute(() => import('@/pages/portal/FlexPayPage'))

// Shopping assisté & colis attendus
const AssistedShoppingNewPage = makeLazyRoute(() => import('@/pages/shopping/AssistedShoppingNewPage'))
const AssistedPurchasesListPage = makeLazyRoute(() => import('@/pages/shopping/AssistedPurchasesListPage'))
const ClientAssistedPurchaseDetailPage = makeLazyRoute(() => import('@/pages/shopping/ClientAssistedPurchaseDetailPage'))
const AssistedPurchaseQuotePage = makeLazyRoute(() => import('@/pages/shopping/AssistedPurchaseQuotePage'))
// ShipmentNoticeCreatePage retiré — Colis Attendus est désormais en suivi pur
const QuoteDashboardPage = makeLazyRoute(() => import('@/pages/shopping/QuoteDashboardPage'))
const AssistedPurchaseAnalyticsPage = makeLazyRoute(() => import('@/pages/analytics/AssistedPurchaseAnalyticsPage'))

// Suivi
const SuiviDashboardPage = makeLazyRoute(() => import('@/pages/suivi/SuiviDashboardPage'))

// SAV
const SavTicketsPage = makeLazyRoute(() => import('@/pages/sav/SavTicketsPage'))
const SavTicketDetailPage = makeLazyRoute(() => import('@/pages/sav/SavTicketDetailPage'))
const SavTicketCreatePage = makeLazyRoute(() => import('@/pages/sav/SavTicketCreatePage'))

// Analytics supplémentaires
const SavAnalyticsPage = makeLazyRoute(() => import('@/pages/analytics/SavAnalyticsPage'))
const ShipmentAnalyticsPage = makeLazyRoute(() => import('@/pages/analytics/ShipmentAnalyticsPage'))
const FinanceAnalyticsPage = makeLazyRoute(() => import('@/pages/analytics/FinanceAnalyticsPage'))

function ShipmentNotices() {
  return (
    <GenericListPage
      title="Colis Attendus — Suivi"
      apiPath="/api/shipment-notices"
      dataKey="notices"
      columns={[
        { key: 'reference_code', label: 'Référence' },
        { key: 'carrier_name', label: 'Transporteur' },
        {
          key: 'vendor_tracking_number',
          label: 'N° Suivi',
          render: (r: ListRow) => {
            const vendor = r['vendor_tracking_number']
            const tracking = r['tracking_number']
            const pick = vendor ?? tracking
            if (typeof pick === 'string' && pick) return pick
            if (typeof pick === 'number') return String(pick)
            return '—'
          },
        },
        { key: 'status', label: 'Statut', render: (r: ListRow) => displayLocalized(readNestedName(r['status'])) },
        {
          key: 'created_at',
          label: 'Date',
          render: (r: ListRow) => {
            const d = r['created_at']
            return typeof d === 'string' ? new Date(d).toLocaleDateString('fr-FR') : '—'
          },
        },
      ]}
      detailPath={(r: ListRow) => `/shipment-notices/${String(r['id'] ?? '')}`}
    />
  )
}

function CustomerPackages() {
  return (
    <GenericListPage
      title="Colis clients"
      apiPath="/api/customer-packages"
      dataKey="packages"
      columns={[
        { key: 'reference_code', label: 'Reference' },
        { key: 'user', label: 'Client', render: (r: ListRow) => displayLocalized(readNestedName(r['user'])) },
        { key: 'status', label: 'Statut', render: (r: ListRow) => displayLocalized(readNestedName(r['status'])) },
        {
          key: 'received_at',
          label: 'Recu le',
          render: (r: ListRow) => {
            const d = r['received_at']
            return typeof d === 'string' ? new Date(d).toLocaleDateString('fr-FR') : '-'
          },
        },
      ]}
      detailPath={(r: ListRow) => `/customer-packages/${String(r['id'] ?? '')}`}
    />
  )
}

const LedgerPage = makeLazyRoute(() => import('@/pages/finance/LedgerPage'))

const InvoicesPage = makeLazyRoute(() => import('@/pages/finance/InvoicesPage'))

function PaymentProofs() {
  return (
    <GenericListPage
      title="Preuves de paiement"
      apiPath="/api/finance/payment-proofs"
      dataKey="proofs"
      columns={[
        { key: 'id', label: '#' },
        { key: 'amount', label: 'Montant' },
        { key: 'status', label: 'Statut' },
        { key: 'created_at', label: 'Date', render: (r: ListRow) => {
            const d = r['created_at']
            return typeof d === 'string' ? new Date(d).toLocaleDateString('fr-FR') : '—'
          } },
      ]}
    />
  )
}

function Notifications() {
  return (
    <GenericListPage
      title="Notifications"
      apiPath="/api/notifications"
      dataKey="notifications"
      columns={[
        {
          key: 'title',
          label: 'Titre',
          render: (r: ListRow) => {
            const data = r['data']
            const dataTitle =
              data && typeof data === 'object' && data !== null && 'title' in data
                ? (data as { title?: unknown }).title
                : undefined
            const fallback = r['title']
            return displayLocalized(dataTitle ?? fallback)
          },
        },
        {
          key: 'read_at',
          label: 'Lu',
          render: (r: ListRow) => (r['read_at'] ? 'Oui' : 'Non'),
        },
        {
          key: 'created_at',
          label: 'Date',
          render: (r: ListRow) => {
            const d = r['created_at']
            return typeof d === 'string' ? new Date(d).toLocaleDateString('fr-FR') : '—'
          },
        },
      ]}
    />
  )
}

function NotFound() {
  return (
    <div className="flex h-96 flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">Page non trouvée</p>
      <Link to="/dashboard" className="mt-4 text-primary hover:underline">Retour au tableau de bord</Link>
    </div>
  )
}

function P({ permission, children }: { permission: string; children: React.ReactNode }) {
  return <ProtectedRoute requiredPermission={permission}>{children}</ProtectedRoute>
}

function PAny({ permissions, children }: { permissions: string[]; children: React.ReactNode }) {
  return <ProtectedRoute requiredPermissions={permissions}>{children}</ProtectedRoute>
}

export const router = createBrowserRouter(
  [
  {
    element: <GuestOnly />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
    ],
  },
  { path: '/track', element: <PublicTrackingPage /> },
  { path: '/suivi', element: <PublicTrackingPage /> },
  { path: '/achat-assiste', element: <AssistedPurchasePublicPage /> },
  { path: '/devis/reponse', element: <QuoteResponsePage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/portal',
        element: <ClientPortalOnly />,
        children: [
          { index: true, element: <ClientDashboard /> },
          { path: 'expeditions', element: <ShipmentsList /> },
          { path: 'expeditions/:id', element: <ShipmentDetail /> },
          { path: 'achats', element: <AssistedPurchasesListPage /> },
          { path: 'achats/:id', element: <ClientAssistedPurchaseDetailPage /> },
          { path: 'casier', element: <ClientLockerPage /> },
          { path: 'factures', element: <ClientInvoicesPage /> },
          { path: 'paiement', element: <FlexPayPage /> },
          { path: 'profil', element: <Profile /> },
          { path: 'sav', element: <SavTicketsPage /> },
          { path: 'sav/new', element: <SavTicketCreatePage /> },
          { path: 'sav/:uuid', element: <SavTicketDetailPage /> },
        ],
      },
      {
        element: <SidebarLayout />,
        children: [
          // ─── Public (auth only) ───
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/profile', element: <Profile /> },
          { path: '/notifications', element: <Notifications /> },

          // ─── Shipments (shipments.view / shipments.create) ───
          { path: '/shipments', element: <P permission="shipments.view"><ShipmentsList /></P> },
          { path: '/shipments/create', element: <P permission="shipments.create"><ShipmentCreate /></P> },
          { path: '/shipments/:id/edit', element: <P permission="shipments.edit"><ShipmentCreate /></P> },
          { path: '/shipments/:id', element: <P permission="shipments.view"><ShipmentDetail /></P> },

          // ─── Services Clients ───
          { path: '/shipment-notices', element: <P permission="pre_alerts.manage"><ShipmentNotices /></P> },
          { path: '/shopping-assiste/nouveau', element: <P permission="assisted_purchase.manage"><AssistedShoppingNewPage /></P> },
          { path: '/purchase-orders', element: <P permission="assisted_purchase.manage"><AssistedPurchasesListPage /></P> },
          { path: '/purchase-orders/suivi', element: <P permission="assisted_purchase.view_quotes"><QuoteDashboardPage /></P> },
          { path: '/purchase-orders/:id', element: <P permission="assisted_purchase.manage"><ClientAssistedPurchaseDetailPage /></P> },
          { path: '/purchase-orders/:id/chiffrage', element: <P permission="assisted_purchase.manage"><AssistedPurchaseQuotePage /></P> },
          { path: '/customer-packages', element: <P permission="customer_packages.view"><CustomerPackages /></P> },

          // ─── Suivi (monitoring opérationnel) ───
          { path: '/monitoring', element: <P permission="suivi.view"><SuiviDashboardPage /></P> },

          // ─── SAV ───
          { path: '/sav', element: <PAny permissions={['sav.view', 'sav.manage']}><SavTicketsPage /></PAny> },
          { path: '/sav/new', element: <PAny permissions={['sav.manage']}><SavTicketCreatePage /></PAny> },
          { path: '/sav/:uuid', element: <PAny permissions={['sav.view', 'sav.manage']}><SavTicketDetailPage /></PAny> },

          // ─── Opérations ───
          { path: '/pickups', element: <P permission="operations.manage_pickups"><PickupsPage /></P> },
          { path: '/regroupements', element: <P permission="operations.view_regroupements"><RegroupementsPage /></P> },

          // ─── Finance ───
          { path: '/finance', element: <P permission="finance.view_payments"><FinanceDashboardPage /></P> },
          { path: '/finance/dashboard', element: <P permission="finance.view_payments"><FinanceDashboardPage /></P> },
          { path: '/finance/invoices', element: <P permission="finance.view_payments"><InvoicesPage /></P> },
          { path: '/finance/ledger', element: <P permission="finance.manage"><LedgerPage /></P> },
          { path: '/finance/payment-proofs', element: <P permission="finance.view_payments"><PaymentProofs /></P> },
          { path: '/finance/refunds', element: <P permission="finance.manage_refunds"><RefundsPage /></P> },

          // ─── Analytique ───
          { path: '/analytics', element: <P permission="analytics.view"><AnalyticsDashboard /></P> },
          { path: '/analytics/overdue', element: <P permission="analytics.view"><OverdueDashboardPage /></P> },
          { path: '/analytics/devis', element: <PAny permissions={['analytics.view', 'reports.view']}><QuoteConversionPage /></PAny> },
          { path: '/analytics/achat-assiste', element: <P permission="analytics.view"><AssistedPurchaseAnalyticsPage /></P> },
          { path: '/analytics/expeditions', element: <P permission="analytics.view"><ShipmentAnalyticsPage /></P> },
          { path: '/analytics/sav', element: <P permission="analytics.view"><SavAnalyticsPage /></P> },
          { path: '/analytics/finance', element: <P permission="analytics.view"><FinanceAnalyticsPage /></P> },

          // ─── Rapports ───
          { path: '/reports', element: <P permission="reports.view"><ReportsHub /></P> },

          // ─── CRM ───
          { path: '/clients', element: <P permission="crm.view"><ClientsPage /></P> },
          { path: '/clients/:id', element: <P permission="crm.view"><ClientDetailPage /></P> },
          { path: '/drivers', element: <P permission="crm.manage_drivers"><DriversPage /></P> },

          // ─── Module Utilisateurs (RBAC) ───
          { path: '/users', element: <P permission="rbac.manage_users"><UsersPage /></P> },
          { path: '/users/roles', element: <P permission="rbac.manage_roles"><RbacRolesPage /></P> },
          { path: '/users/permissions', element: <Navigate to="/users/roles" replace /> },
          { path: '/users/navigation', element: <P permission="rbac.manage_menus"><RbacNavigationPage /></P> },
          { path: '/users/activity-log', element: <P permission="rbac.manage_users"><UserActivityLogPage /></P> },

          // ─── Paramètres (sans RBAC) ───
          { path: '/settings', element: <PAny permissions={['admin.manage_settings', 'admin.manage_pricing', 'admin.manage_agencies']}><SettingsHub /></PAny> },
          { path: '/settings/*', element: <PAny permissions={['admin.manage_settings', 'admin.manage_pricing', 'admin.manage_agencies']}><SettingsHub /></PAny> },
        ],
      },
    ],
  },
  { path: '/', element: <Login /> },
  { path: '*', element: <NotFound /> },
  ],
)
