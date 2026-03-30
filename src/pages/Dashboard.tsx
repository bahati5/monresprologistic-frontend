import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Truck, DollarSign, Users, MapPin, Boxes, FileText } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/api/dashboard').then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2"><div className="h-4 w-24 rounded bg-muted" /></CardHeader>
              <CardContent><div className="h-8 w-16 rounded bg-muted" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const dashboardType = data?.dashboard_type || 'admin'
  const stats = data?.stats || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">Bienvenue, {user?.name}</p>
      </div>

      {dashboardType === 'driver' && (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Ramassages en attente" value={stats.pickups_pending} icon={<MapPin />} />
          <StatCard title="Livraisons en cours" value={stats.deliveries_pending} icon={<Truck />} />
          <StatCard title="Livrees aujourd'hui" value={stats.completed_today} icon={<Package />} />
        </div>
      )}

      {dashboardType === 'client' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Expeditions" value={stats.shipments_total} icon={<Truck />} />
          <StatCard title="En transit" value={stats.in_transit} icon={<Package />} />
          <StatCard title="Pre-alertes" value={stats.pre_alerts} icon={<FileText />} />
          <StatCard title="Solde portefeuille" value={stats.wallet_balance} icon={<DollarSign />} prefix="$" />
        </div>
      )}

      {(dashboardType === 'admin' || dashboardType === 'employee') && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Expeditions totales" value={stats.shipments_total} icon={<Truck />} />
          <StatCard title="En transit" value={stats.in_transit} icon={<Package />} />
          <StatCard title="Ramassages" value={stats.pickups_count} icon={<MapPin />} />
          <StatCard title="Consolidations" value={stats.consolidations_count} icon={<Boxes />} />
          <StatCard title="Clients" value={stats.clients_count} icon={<Users />} />
          <StatCard title="Revenu du mois" value={stats.monthly_revenue} icon={<DollarSign />} prefix="$" />
          <StatCard title="Pre-alertes" value={stats.pre_alerts} icon={<FileText />} />
          <StatCard title="Chauffeurs actifs" value={stats.active_drivers} icon={<Users />} />
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon, prefix }: { title: string; value?: number | string; icon: React.ReactNode; prefix?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{prefix}{value ?? 0}</div>
      </CardContent>
    </Card>
  )
}
