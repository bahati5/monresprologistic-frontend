import { createBrowserRouter } from 'react-router-dom'
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

const Login = () => lazily(() => import('@/pages/auth/Login'))
const Register = () => lazily(() => import('@/pages/auth/Register'))
const Dashboard = () => lazily(() => import('@/pages/Dashboard'))
const Profile = () => lazily(() => import('@/pages/Profile'))
const ShipmentsList = () => lazily(() => import('@/pages/shipments/ShipmentsList'))
const ShipmentDetail = () => lazily(() => import('@/pages/shipments/ShipmentDetail'))
const ShipmentCreate = () => lazily(() => import('@/pages/shipments/ShipmentCreate'))

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
        { key: 'status', label: 'Statut', render: (r: any) => r.status?.name || '-' },
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
        { key: 'user', label: 'Client', render: (r: any) => r.user?.name || '-' },
        { key: 'total_amount', label: 'Total' },
        { key: 'status', label: 'Statut', render: (r: any) => r.status?.name || '-' },
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
        { key: 'user', label: 'Client', render: (r: any) => r.user?.name || '-' },
        { key: 'status', label: 'Statut', render: (r: any) => r.status?.name || '-' },
        { key: 'received_at', label: 'Recu le', render: (r: any) => r.received_at ? new Date(r.received_at).toLocaleDateString('fr-FR') : '-' },
      ]}
      detailPath={(r: any) => `/customer-packages/${r.id}`}
    />
  )
}

function Pickups() {
  return (
    <GenericListPage
      title="Ramassages"
      apiPath="/api/pickups"
      dataKey="pickups"
      columns={[
        { key: 'id', label: '#' },
        { key: 'client', label: 'Client', render: (r: any) => r.client?.name || r.user?.name || '-' },
        { key: 'status', label: 'Statut', render: (r: any) => r.status?.name || '-' },
        { key: 'scheduled_at', label: 'Prevu le', render: (r: any) => r.scheduled_at ? new Date(r.scheduled_at).toLocaleDateString('fr-FR') : '-' },
      ]}
      createPath="/pickups/create"
      createLabel="Nouveau ramassage"
    />
  )
}

function Consolidations() {
  return (
    <GenericListPage
      title="Consolidations"
      apiPath="/api/consolidations"
      dataKey="consolidations"
      columns={[
        { key: 'id', label: '#' },
        { key: 'shipments_count', label: 'Expeditions' },
        { key: 'status', label: 'Statut', render: (r: any) => r.status?.name || '-' },
        { key: 'created_at', label: 'Date', render: (r: any) => new Date(r.created_at).toLocaleDateString('fr-FR') },
      ]}
    />
  )
}

function Clients() {
  return (
    <GenericListPage
      title="Clients"
      apiPath="/api/clients"
      dataKey="clients"
      columns={[
        { key: 'name', label: 'Nom' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Telephone' },
        { key: 'is_active', label: 'Actif', render: (r: any) => r.is_active ? 'Oui' : 'Non' },
      ]}
      detailPath={(r: any) => `/clients/${r.id}`}
    />
  )
}

function Recipients() {
  return (
    <GenericListPage
      title="Destinataires"
      apiPath="/api/recipients"
      dataKey="recipients"
      columns={[
        { key: 'name', label: 'Nom' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Telephone' },
        { key: 'city', label: 'Ville' },
        { key: 'country', label: 'Pays' },
      ]}
      createPath="/recipients/create"
      createLabel="Nouveau destinataire"
    />
  )
}

function UsersManagement() {
  return (
    <GenericListPage
      title="Utilisateurs"
      apiPath="/api/users"
      dataKey="users"
      columns={[
        { key: 'name', label: 'Nom' },
        { key: 'email', label: 'Email' },
        { key: 'roles', label: 'Roles', render: (r: any) => (r.roles || []).join(', ') },
        { key: 'is_active', label: 'Actif', render: (r: any) => r.is_active ? 'Oui' : 'Non' },
      ]}
    />
  )
}

function Drivers() {
  return (
    <GenericListPage
      title="Chauffeurs"
      apiPath="/api/drivers"
      dataKey="drivers"
      columns={[
        { key: 'name', label: 'Nom' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Telephone' },
        { key: 'is_active', label: 'Actif', render: (r: any) => r.is_active ? 'Oui' : 'Non' },
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
        { key: 'title', label: 'Titre', render: (r: any) => r.data?.title || r.title || '-' },
        { key: 'read_at', label: 'Lu', render: (r: any) => r.read_at ? 'Oui' : 'Non' },
        { key: 'created_at', label: 'Date', render: (r: any) => new Date(r.created_at).toLocaleDateString('fr-FR') },
      ]}
    />
  )
}

function FinanceDashboard() {
  return <div className="text-muted-foreground">Finance dashboard - a implementer</div>
}

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
        { key: 'user', label: 'Client', render: (r: any) => r.user?.name || '-' },
        { key: 'balance', label: 'Solde' },
      ]}
    />
  )
}

function Reports() {
  return <div className="text-muted-foreground">Rapports - a implementer</div>
}

function SettingsHub() {
  return lazily(() => import('@/pages/settings/SettingsHub'))
}

function NotFound() {
  return (
    <div className="flex h-96 flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">Page non trouvee</p>
      <a href="/dashboard" className="mt-4 text-primary hover:underline">Retour au tableau de bord</a>
    </div>
  )
}

export const router = createBrowserRouter([
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
          { path: '/pickups', element: <Pickups /> },
          { path: '/consolidations', element: <Consolidations /> },

          // Finance
          { path: '/finance/dashboard', element: <FinanceDashboard /> },
          { path: '/finance/invoices', element: <Invoices /> },
          { path: '/finance/payment-proofs', element: <PaymentProofs /> },
          { path: '/finance/wallets', element: <Wallets /> },

          // Reports
          { path: '/reports', element: <Reports /> },

          // Management
          { path: '/clients', element: <Clients /> },
          { path: '/users', element: <UsersManagement /> },
          { path: '/drivers', element: <Drivers /> },
          { path: '/recipients', element: <Recipients /> },

          // Settings
          { path: '/settings', element: <SettingsHub /> },
          { path: '/settings/*', element: <SettingsHub /> },
        ],
      },
    ],
  },
  { path: '/', element: <Login /> },
  { path: '*', element: <NotFound /> },
])
