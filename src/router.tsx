import { createBrowserRouter } from 'react-router-dom'
import { displayLocalized } from '@/lib/localizedString'
import { useFormatMoney } from '@/hooks/useSettings'
import { lazy, Suspense, type ReactNode } from 'react'
import RequireAuth from '@/components/auth/RequireAuth'
import GuestOnly from '@/components/auth/GuestOnly'
import SidebarLayout from '@/layouts/SidebarLayout'
import GenericListPage from '@/pages/GenericListPage'

const Loader = () => (
  <div className="flex h-64 items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
)

function lazily(factory: () => Promise<{ default: React.ComponentType }>) {
  const Component = lazy(factory)
  return (
    <Suspense fallback={<Loader />}>
      <Component />
    </Suspense>
  )
}

// Auth
const Login = () => lazily(() => import('@/pages/auth/Login'))
const Register = () => lazily(() => import('@/pages/auth/Register'))

// Core
const Dashboard = () => lazily(() => import('@/pages/Dashboard'))
const Profile = () => lazily(() => import('@/pages/Profile'))

// Shipments
const ShipmentsList = () => lazily(() => import('@/pages/shipments/ShipmentsList'))
const ShipmentDetail = () => lazily(() => import('@/pages/shipments/ShipmentDetail'))
const ShipmentCreate = () => lazily(() => import('@/pages/shipments/ShipmentCreate'))

// Operations
const PickupsPage = () => lazily(() => import('@/pages/operations/PickupsPage'))
const RegroupementsPage = () => lazily(() => import('@/pages/operations/RegroupementsPage'))

// Finance
const FinanceDashboardPage = () => lazily(() => import('@/pages/finance/FinanceDashboardPage'))

// CRM
const ClientsPage = () => lazily(() => import('@/pages/crm/ClientsPage'))
const ClientDetailPage = () => lazily(() => import('@/pages/crm/ClientDetailPage'))
const UsersPage = () => lazily(() => import('@/pages/crm/UsersPage'))
const DriversPage = () => lazily(() => import('@/pages/crm/DriversPage'))

// Reports
const ReportsHub = () => lazily(() => import('@/pages/reports/ReportsHub'))

// Settings
const SettingsHub = () => lazily(() => import('@/pages/settings/SettingsHub'))

// Shopping assisté & colis attendus (création)
const AssistedShoppingNewPage = () => lazily(() => import('@/pages/shopping/AssistedShoppingNewPage'))
const AssistedPurchasesListPage = () => lazily(() => import('@/pages/shopping/AssistedPurchasesListPage'))
const ClientAssistedPurchaseDetailPage = () => lazily(() => import('@/pages/shopping/ClientAssistedPurchaseDetailPage'))
const AssistedPurchaseQuotePage = () => lazily(() => import('@/pages/shopping/AssistedPurchaseQuotePage'))
const ShipmentNoticeCreatePage = () => lazily(() => import('@/pages/inbound/ShipmentNoticeCreatePage'))

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
          render: (r: any) => r.vendor_tracking_number || r.tracking_number || '—',
        },
        { key: 'status', label: 'Statut', render: (r: any) => displayLocalized(r.status?.name) },
        { key: 'created_at', label: 'Date', render: (r: any) => new Date(r.created_at).toLocaleDateString('fr-FR') },
      ]}
      createPath="/shipment-notices/create"
      createLabel="Nouveau Colis Attendu"
      detailPath={(r: any) => `/shipment-notices/${r.id}`}
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
        { key: 'user', label: 'Client', render: (r: any) => displayLocalized(r.user?.name) },
        { key: 'status', label: 'Statut', render: (r: any) => displayLocalized(r.status?.name) },
        { key: 'received_at', label: 'Recu le', render: (r: any) => r.received_at ? new Date(r.received_at).toLocaleDateString('fr-FR') : '-' },
      ]}
      detailPath={(r: any) => `/customer-packages/${r.id}`}
    />
  )
}

function LedgerAmountCell({ row }: { row: { amount?: unknown } }) {
  const { formatMoney } = useFormatMoney()
  if (row.amount == null || row.amount === '') return '-'
  const n = typeof row.amount === 'number' ? row.amount : Number(row.amount)
  if (!Number.isFinite(n)) return String(row.amount)
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
          render: (r: any) => <LedgerAmountCell row={r} />,
        },
        { key: 'description', label: 'Description', render: (r: any) => r.description ?? '-' },
        {
          key: 'created_at',
          label: 'Date',
          render: (r: any) => (r.created_at ? new Date(r.created_at).toLocaleString('fr-FR') : '-'),
        },
      ]}
    />
  )
}

function Invoices() {
  return (
    <GenericListPage
      title="Facturation"
      apiPath="/api/finance/invoices"
      dataKey="invoices"
      columns={[
        { key: 'id', label: '#' },
        { key: 'amount', label: 'Montant' },
        { key: 'status', label: 'Statut' },
        { key: 'created_at', label: 'Date', render: (r: any) => new Date(r.created_at).toLocaleDateString('fr-FR') },
      ]}
    />
  )
}

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
        { key: 'created_at', label: 'Date', render: (r: any) => new Date(r.created_at).toLocaleDateString('fr-FR') },
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
        { key: 'title', label: 'Titre', render: (r: any) => displayLocalized(r.data?.title || r.title) },
        { key: 'read_at', label: 'Lu', render: (r: any) => r.read_at ? 'Oui' : 'Non' },
        { key: 'created_at', label: 'Date', render: (r: any) => new Date(r.created_at).toLocaleDateString('fr-FR') },
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
      <a href="/dashboard" className="mt-4 text-primary hover:underline">Retour au tableau de bord</a>
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
  {
    element: <RequireAuth />,
    children: [
      {
        element: <SidebarLayout />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/profile', element: <Profile /> },
          { path: '/notifications', element: <Notifications /> },

          // Shipments
          { path: '/shipments', element: <ShipmentsList /> },
          { path: '/shipments/create', element: <ShipmentCreate /> },
          { path: '/shipments/:id', element: <ShipmentDetail /> },

          // Inbound
          { path: '/shipment-notices/create', element: <ShipmentNoticeCreatePage /> },
          { path: '/shipment-notices', element: <ShipmentNotices /> },
          { path: '/shopping-assiste/nouveau', element: <AssistedShoppingNewPage /> },
          { path: '/purchase-orders', element: <AssistedPurchasesListPage /> },
          { path: '/purchase-orders/:id', element: <ClientAssistedPurchaseDetailPage /> },
          { path: '/purchase-orders/:id/chiffrage', element: <AssistedPurchaseQuotePage /> },
          { path: '/customer-packages', element: <CustomerPackages /> },

          // Operations
          { path: '/pickups', element: <PickupsPage /> },
          { path: '/regroupements', element: <RegroupementsPage /> },

          // Finance
          { path: '/finance', element: <FinanceDashboardPage /> },
          { path: '/finance/dashboard', element: <FinanceDashboardPage /> },
          { path: '/finance/invoices', element: <Invoices /> },
          { path: '/finance/ledger', element: <LedgerEntries /> },
          { path: '/finance/payment-proofs', element: <PaymentProofs /> },

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
  {
    future: {
      v7_startTransition: true,
    },
  }
)
