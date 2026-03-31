import { createBrowserRouter } from 'react-router-dom'
import { displayLocalized } from '@/lib/localizedString'
import { lazy, Suspense } from 'react'
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
const ConsolidationsPage = () => lazily(() => import('@/pages/operations/ConsolidationsPage'))

// Finance
const FinanceDashboardPage = () => lazily(() => import('@/pages/finance/FinanceDashboardPage'))

// CRM
const ClientsPage = () => lazily(() => import('@/pages/crm/ClientsPage'))
const UsersPage = () => lazily(() => import('@/pages/crm/UsersPage'))
const DriversPage = () => lazily(() => import('@/pages/crm/DriversPage'))
const RecipientsPage = () => lazily(() => import('@/pages/crm/RecipientsPage'))

// Reports
const ReportsHub = () => lazily(() => import('@/pages/reports/ReportsHub'))

// Settings
const SettingsHub = () => lazily(() => import('@/pages/settings/SettingsHub'))

// Inbound — still using GenericListPage (will get dedicated pages in Phase 4)
function ShipmentNotices() {
  return (
    <GenericListPage
      title="Avis d'expedition"
      apiPath="/api/shipment-notices"
      dataKey="notices"
      columns={[
        { key: 'reference_code', label: 'Reference' },
        { key: 'carrier_name', label: 'Transporteur' },
        { key: 'tracking_number', label: 'Tracking' },
        { key: 'status', label: 'Statut', render: (r: any) => displayLocalized(r.status?.name) },
        { key: 'created_at', label: 'Date', render: (r: any) => new Date(r.created_at).toLocaleDateString('fr-FR') },
      ]}
      createPath="/shipment-notices/create"
      createLabel="Nouvel avis"
      detailPath={(r: any) => `/shipment-notices/${r.id}`}
    />
  )
}

function PurchaseOrders() {
  return (
    <GenericListPage
      title="Ordres d'achat"
      apiPath="/api/purchase-orders"
      dataKey="orders"
      columns={[
        { key: 'reference_code', label: 'Reference' },
        { key: 'user', label: 'Client', render: (r: any) => displayLocalized(r.user?.name) },
        { key: 'total_amount', label: 'Total' },
        { key: 'status', label: 'Statut', render: (r: any) => displayLocalized(r.status?.name) },
        { key: 'created_at', label: 'Date', render: (r: any) => new Date(r.created_at).toLocaleDateString('fr-FR') },
      ]}
      createPath="/purchase-orders/create"
      createLabel="Nouvel ordre"
      detailPath={(r: any) => `/purchase-orders/${r.id}`}
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

// Finance sub-pages still using GenericListPage
function Invoices() {
  return (
    <GenericListPage
      title="Factures"
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

function Wallets() {
  return (
    <GenericListPage
      title="Portefeuilles"
      apiPath="/api/finance/wallets"
      dataKey="wallets"
      columns={[
        { key: 'user', label: 'Client', render: (r: any) => displayLocalized(r.user?.name) },
        { key: 'balance', label: 'Solde' },
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
          { path: '/shipment-notices', element: <ShipmentNotices /> },
          { path: '/purchase-orders', element: <PurchaseOrders /> },
          { path: '/customer-packages', element: <CustomerPackages /> },

          // Operations
          { path: '/pickups', element: <PickupsPage /> },
          { path: '/consolidations', element: <ConsolidationsPage /> },

          // Finance
          { path: '/finance', element: <FinanceDashboardPage /> },
          { path: '/finance/dashboard', element: <FinanceDashboardPage /> },
          { path: '/finance/invoices', element: <Invoices /> },
          { path: '/finance/payment-proofs', element: <PaymentProofs /> },
          { path: '/finance/wallets', element: <Wallets /> },

          // Reports
          { path: '/reports', element: <ReportsHub /> },

          // CRM Management
          { path: '/clients', element: <ClientsPage /> },
          { path: '/users', element: <UsersPage /> },
          { path: '/drivers', element: <DriversPage /> },
          { path: '/recipients', element: <RecipientsPage /> },

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
