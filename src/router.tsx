/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Link } from 'react-router-dom'
import { displayLocalized } from '@/lib/localizedString'
import { useFormatMoney } from '@/hooks/useSettings'
import { lazy, Suspense, type ComponentType } from 'react'
import RequireAuth from '@/components/auth/RequireAuth'
import GuestOnly from '@/components/auth/GuestOnly'
import ClientPortalOnly from '@/components/auth/ClientPortalOnly'
import SidebarLayout from '@/layouts/SidebarLayout'
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

// New pages
const RefundsPage = makeLazyRoute(() => import('@/pages/finance/RefundsPage'))
const AnalyticsDashboard = makeLazyRoute(() => import('@/pages/analytics/AnalyticsDashboard'))
const OverdueDashboardPage = makeLazyRoute(() => import('@/pages/analytics/OverdueDashboardPage'))
const QuoteConversionPage = makeLazyRoute(() => import('@/pages/analytics/QuoteConversionPage'))
const ClientDashboard = makeLazyRoute(() => import('@/pages/portal/ClientDashboard'))
const ClientLockerPage = makeLazyRoute(() => import('@/pages/portal/ClientLockerPage'))
const ClientInvoicesPage = makeLazyRoute(() => import('@/pages/portal/ClientInvoicesPage'))
const FlexPayPage = makeLazyRoute(() => import('@/pages/portal/FlexPayPage'))

// Shopping assisté & colis attendus (création)
const AssistedShoppingNewPage = makeLazyRoute(() => import('@/pages/shopping/AssistedShoppingNewPage'))
const AssistedPurchasesListPage = makeLazyRoute(() => import('@/pages/shopping/AssistedPurchasesListPage'))
const ClientAssistedPurchaseDetailPage = makeLazyRoute(() => import('@/pages/shopping/ClientAssistedPurchaseDetailPage'))
const AssistedPurchaseQuotePage = makeLazyRoute(() => import('@/pages/shopping/AssistedPurchaseQuotePage'))
const ShipmentNoticeCreatePage = makeLazyRoute(() => import('@/pages/inbound/ShipmentNoticeCreatePage'))
const QuoteDashboardPage = makeLazyRoute(() => import('@/pages/shopping/QuoteDashboardPage'))
const AssistedPurchaseAnalyticsPage = makeLazyRoute(() => import('@/pages/analytics/AssistedPurchaseAnalyticsPage'))

// Inbound — still using GenericListPage (will get dedicated pages in Phase 4)
function ShipmentNotices() {
  return (
    <GenericListPage
      title="Colis Attendus"
      apiPath="/api/shipment-notices"
      dataKey="notices"
      columns={[
        { key: 'reference_code', label: 'Reference' },
        { key: 'carrier_name', label: 'Transporteur' },
        {
          key: 'vendor_tracking_number',
          label: 'Suivi',
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
      createPath="/shipment-notices/create"
      createLabel="Nouveau Colis Attendu"
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

function LedgerAmountCell({ row }: { row: ListRow }) {
  const { formatMoney } = useFormatMoney()
  const amount = row['amount']
  if (amount == null || amount === '') return '-'
  const n = typeof amount === 'number' ? amount : Number(amount)
  if (!Number.isFinite(n)) return String(amount)
  return formatMoney(n)
}

// Finance sub-pages still using GenericListPage
function LedgerEntries() {
  return (
    <GenericListPage
      title="Comptabilité — Grand livre"
      apiPath="/api/finance/ledger"
      dataKey="entries"
      columns={[
        { key: 'id', label: '#' },
        { key: 'type', label: 'Type' },
        {
          key: 'amount',
          label: 'Montant',
          render: (r: ListRow) => <LedgerAmountCell row={r} />,
        },
        { key: 'description', label: 'Description', render: (r: ListRow) => String(r['description'] ?? '-') },
        {
          key: 'created_at',
          label: 'Date',
          render: (r: ListRow) => {
            const d = r['created_at']
            return typeof d === 'string' ? new Date(d).toLocaleString('fr-FR') : '-'
          },
        },
      ]}
    />
  )
}

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

// Reports placeholder removed — using dedicated ReportsHub page

function NotFound() {
  return (
    <div className="flex h-96 flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">Page non trouvee</p>
      <Link to="/dashboard" className="mt-4 text-primary hover:underline">Retour au tableau de bord</Link>
    </div>
  )
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
          { path: 'achats', element: <AssistedPurchasesListPage /> },
          { path: 'casier', element: <ClientLockerPage /> },
          { path: 'factures', element: <ClientInvoicesPage /> },
          { path: 'paiement', element: <FlexPayPage /> },
          { path: 'profil', element: <Profile /> },
        ],
      },
      {
        element: <SidebarLayout />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/profile', element: <Profile /> },
          { path: '/notifications', element: <Notifications /> },

          // Shipments
          { path: '/shipments', element: <ShipmentsList /> },
          { path: '/shipments/create', element: <ShipmentCreate /> },
          { path: '/shipments/:id/edit', element: <ShipmentCreate /> },
          { path: '/shipments/:id', element: <ShipmentDetail /> },

          // Inbound
          { path: '/shipment-notices/create', element: <ShipmentNoticeCreatePage /> },
          { path: '/shipment-notices', element: <ShipmentNotices /> },
          { path: '/shopping-assiste/nouveau', element: <AssistedShoppingNewPage /> },
          { path: '/purchase-orders', element: <AssistedPurchasesListPage /> },
          { path: '/purchase-orders/suivi', element: <QuoteDashboardPage /> },
          { path: '/purchase-orders/:id', element: <ClientAssistedPurchaseDetailPage /> },
          { path: '/purchase-orders/:id/chiffrage', element: <AssistedPurchaseQuotePage /> },
          { path: '/customer-packages', element: <CustomerPackages /> },

          // Operations
          { path: '/pickups', element: <PickupsPage /> },
          { path: '/regroupements', element: <RegroupementsPage /> },

          // Finance
          { path: '/finance', element: <FinanceDashboardPage /> },
          { path: '/finance/dashboard', element: <FinanceDashboardPage /> },
          { path: '/finance/invoices', element: <InvoicesPage /> },
          { path: '/finance/ledger', element: <LedgerEntries /> },
          { path: '/finance/payment-proofs', element: <PaymentProofs /> },
          { path: '/finance/refunds', element: <RefundsPage /> },

          // Analytics
          { path: '/analytics', element: <AnalyticsDashboard /> },
          { path: '/analytics/overdue', element: <OverdueDashboardPage /> },
          { path: '/analytics/devis', element: <QuoteConversionPage /> },
          { path: '/analytics/achat-assiste', element: <AssistedPurchaseAnalyticsPage /> },

          // Reports
          { path: '/reports', element: <ReportsHub /> },

          // CRM Management
          { path: '/clients', element: <ClientsPage /> },
          { path: '/clients/:id', element: <ClientDetailPage /> },
          { path: '/users', element: <UsersPage /> },
          { path: '/drivers', element: <DriversPage /> },

          // Settings
          { path: '/settings', element: <SettingsHub /> },
          { path: '/settings/*', element: <SettingsHub /> },
        ],
      },
    ],
  },
  { path: '/', element: <Login /> },
  { path: '*', element: <NotFound /> },
  ],
)
