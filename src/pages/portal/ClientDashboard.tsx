import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ShoppingBag, Box, AlertCircle, RefreshCw, HeadphonesIcon, AlertTriangle, ArrowRight, Receipt, Truck } from 'lucide-react'
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
    <div className="space-y-4 sm:space-y-6">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-700 to-teal-500 p-5 text-white shadow-sm sm:p-6">
        <div className="max-w-2xl space-y-3">
          <div>
            <p className="text-sm font-medium text-white/75">Espace client</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Bienvenue, {user?.name}</h1>
          </div>
          <p className="text-sm text-white/85 sm:text-base">
            Suivez vos colis, achats, factures et demandes SAV depuis une interface mobile unifiée.
          </p>
          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <Button asChild className="min-h-11 bg-white text-cyan-900 hover:bg-white/90">
              <Link to="/portal/expeditions">
                <Truck className="mr-2 h-4 w-4" />
                Mes expéditions
              </Link>
            </Button>
            <Button asChild variant="outline" className="min-h-11 border-white/35 bg-white/10 text-white hover:bg-white/20">
              <Link to="/portal/sav">
                <HeadphonesIcon className="mr-2 h-4 w-4" />
                Support SAV
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* §11.3 — Alertes prioritaires */}
      {priorityAlerts.length > 0 && (
        <div className="space-y-2">
          {priorityAlerts.map((alert, idx) => (
            <div
              key={idx}
              className={`flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-start sm:justify-between ${
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
                <Button size="sm" variant="outline" asChild className="min-h-9 shrink-0 text-xs">
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

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex min-h-[104px] flex-col justify-between gap-3 p-3 sm:min-h-0 sm:flex-row sm:items-center sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 sm:h-10 sm:w-10">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold sm:text-2xl">{kpis.shipments_in_transit ?? 0}</p>
              <p className="text-xs text-muted-foreground">En transit</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex min-h-[104px] flex-col justify-between gap-3 p-3 sm:min-h-0 sm:flex-row sm:items-center sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600 sm:h-10 sm:w-10">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold sm:text-2xl">{kpis.purchases_active ?? 0}</p>
              <p className="text-xs text-muted-foreground">Achats en cours</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex min-h-[104px] flex-col justify-between gap-3 p-3 sm:min-h-0 sm:flex-row sm:items-center sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 sm:h-10 sm:w-10">
              <Box className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold sm:text-2xl">{kpis.packages_at_hub ?? 0}</p>
              <p className="text-xs text-muted-foreground">Au casier</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex min-h-[104px] flex-col justify-between gap-3 p-3 sm:min-h-0 sm:flex-row sm:items-center sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 sm:h-10 sm:w-10">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold sm:text-2xl">{kpis.pending_actions ?? 0}</p>
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
              to="/portal/expeditions"
              className="flex min-h-12 items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Package className="h-4 w-4 text-blue-600 shrink-0" aria-hidden />
              Mes expéditions
            </Link>
            <Link
              to="/portal/achats"
              className="flex min-h-12 items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              <ShoppingBag className="h-4 w-4 text-purple-600 shrink-0" aria-hidden />
              Mes achats assistés
            </Link>
            <Link
              to="/portal/casier"
              className="flex min-h-12 items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Box className="h-4 w-4 text-green-600 shrink-0" aria-hidden />
              Mon casier
            </Link>
            <Link
              to="/portal/sav/new"
              className="flex min-h-12 items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              <HeadphonesIcon className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden />
              Nouveau ticket SAV
            </Link>
            <Link
              to="/portal/factures"
              className="flex min-h-12 items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Receipt className="h-4 w-4 text-orange-600 shrink-0" aria-hidden />
              Mes factures
            </Link>
            <Link
              to="/portal/paiement"
              className="flex min-h-12 items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" aria-hidden />
              Paiements
            </Link>
          </nav>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Remboursements</CardTitle>
          <Link
            to="/portal/factures"
            className="inline-flex min-h-9 items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
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
                <Link key={item.id} to={`/portal/expeditions/${item.id}`} className="flex min-h-11 items-center justify-between gap-3 rounded-lg p-2 transition-colors hover:bg-muted">
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
