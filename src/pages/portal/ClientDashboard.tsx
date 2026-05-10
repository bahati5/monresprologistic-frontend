import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ShoppingBag, Box, AlertCircle, RefreshCw, BellRing, ExternalLink, AlertTriangle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { DraftsList } from '@/components/drafts/DraftsList'

interface PriorityAlert {
  severity?: string
  title?: string
  message?: string
  action_url?: string
  action_label?: string
}

interface ClientRecentShipment {
  id: number
  public_tracking?: string
  updated_at?: string
}

export default function ClientDashboard() {
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['client-dashboard'],
    queryFn: () => api.get('/api/client/dashboard').then(r => r.data),
  })

  const kpis = data?.kpis ?? {}
  const recentActivity = data?.recent_activity ?? []
  const priorityAlerts: PriorityAlert[] = (data?.priority_alerts ?? []) as PriorityAlert[]

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bienvenue, {user?.name}</h1>
        <p className="text-muted-foreground">Votre espace client Monrespro Logistic</p>
      </div>

      {/* §11.3 — Alertes prioritaires */}
      {priorityAlerts.length > 0 && (
        <div className="space-y-2">
          {priorityAlerts.map((alert, idx) => (
            <div
              key={idx}
              className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 ${
                alert.severity === 'warning'
                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                  : 'border-blue-200 bg-blue-50 text-blue-900'
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${alert.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'}`} />
                <div>
                  <p className="font-medium text-sm">{alert.title}</p>
                  <p className="text-xs opacity-80">{alert.message}</p>
                </div>
              </div>
              {alert.action_url && (
                <Button size="sm" variant="outline" asChild className="shrink-0 text-xs h-7">
                  <Link to={alert.action_url}>
                    {alert.action_label ?? 'Voir'} <ArrowRight size={12} className="ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <DraftsList />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{kpis.shipments_in_transit ?? 0}</p>
              <p className="text-xs text-muted-foreground">En transit</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{kpis.purchases_active ?? 0}</p>
              <p className="text-xs text-muted-foreground">Achats en cours</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <Box className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{kpis.packages_at_hub ?? 0}</p>
              <p className="text-xs text-muted-foreground">Au casier</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{kpis.pending_actions ?? 0}</p>
              <p className="text-xs text-muted-foreground">Actions en attente</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accès rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <nav className="grid gap-2 sm:grid-cols-2" aria-label="Raccourcis portail client">
            <Link
              to="/shipments"
              className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <Package className="h-4 w-4 text-blue-600 shrink-0" aria-hidden />
              Mes expéditions
            </Link>
            <Link
              to="/purchase-orders"
              className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <ShoppingBag className="h-4 w-4 text-purple-600 shrink-0" aria-hidden />
              Mes achats assistés
            </Link>
            <Link
              to="/shipment-notices"
              className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <BellRing className="h-4 w-4 text-amber-600 shrink-0" aria-hidden />
              Colis attendus
            </Link>
            <Link
              to="/shopping-assiste/nouveau"
              className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <ShoppingBag className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden />
              Nouvelle demande shopping
            </Link>
            <Link
              to="/track"
              className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors sm:col-span-2"
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
              Suivre un colis (sans compte)
            </Link>
            <Link
              to="/portal/casier"
              className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <Box className="h-4 w-4 text-green-600 shrink-0" aria-hidden />
              Mon casier (colis au hub)
            </Link>
            <Link
              to="/portal/factures"
              className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <AlertCircle className="h-4 w-4 text-orange-600 shrink-0" aria-hidden />
              Mes factures
            </Link>
          </nav>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Remboursements</CardTitle>
          <Link
            to="/finance/refunds"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground" aria-hidden />
            Voir ou demander
          </Link>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Suivez vos demandes et soumettez une nouvelle demande avec justificatif depuis la page dédiée.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activité récente</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune activité récente.</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((item: ClientRecentShipment) => (
                <Link key={item.id} to={`/shipments/${item.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.public_tracking}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.updated_at ? new Date(item.updated_at).toLocaleDateString('fr-FR') : '—'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
