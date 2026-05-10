import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Package, TrendingUp, AlertTriangle, BarChart3, Clock } from 'lucide-react'
import { CountryNameWithFlag } from '@/components/CountryNameWithFlag'
import { displayLocalized } from '@/lib/localizedString'

interface TopClientRow {
  revenue?: number
  count?: number
  creator?: { name?: string }
}

interface DestDistributionRow {
  dest_country?: Record<string, unknown>
  count?: number
}

interface OverdueTabShipment {
  id: number
  public_tracking?: string
  created_at?: string
  creator?: { name?: string }
}

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState('30')

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', period],
    queryFn: () => api.get('/api/dashboard/analytics', { params: { days: period } }).then(r => r.data),
  })

  const { data: overdue } = useQuery({
    queryKey: ['overdue'],
    queryFn: () => api.get('/api/dashboard/overdue', { params: { threshold: 14 } }).then(r => r.data),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytique</h1>
          <p className="text-sm text-muted-foreground">Tableaux de bord avancés</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 derniers jours</SelectItem>
            <SelectItem value="30">30 derniers jours</SelectItem>
            <SelectItem value="90">90 derniers jours</SelectItem>
            <SelectItem value="365">12 derniers mois</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.shipments_total ?? 0}</p>
                <p className="text-xs text-muted-foreground">Expéditions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Number(analytics?.revenue ?? 0).toFixed(0)} USD</p>
                <p className="text-xs text-muted-foreground">Chiffre d'affaires</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.shipments_delivered ?? 0}</p>
                <p className="text-xs text-muted-foreground">Livrées</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overdue?.overdue_count ?? 0}</p>
                <p className="text-xs text-muted-foreground">En retard</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="operations" className="w-full">
        <TabsList>
          <TabsTrigger value="operations">Opérationnel</TabsTrigger>
          <TabsTrigger value="clients">Top Clients</TabsTrigger>
          <TabsTrigger value="destinations">Destinations</TabsTrigger>
          <TabsTrigger value="overdue">En retard</TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Répartition par statut</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(analytics?.by_status ?? {}).map(([status, count]) => (
                  <div key={status} className="rounded-lg border p-3 text-center">
                    <p className="text-lg font-bold">{count as number}</p>
                    <p className="text-xs text-muted-foreground capitalize">{status.replace(/_/g, ' ')}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Top 10 Clients</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(analytics?.top_clients ?? []).map((client: TopClientRow, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">{i + 1}</div>
                      <span className="text-sm font-medium">{client.creator?.name ?? 'Inconnu'}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{Number(client.revenue ?? 0).toFixed(0)} USD</p>
                      <p className="text-xs text-muted-foreground">{client.count} expéditions</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="destinations" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Destinations</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(analytics?.dest_distribution ?? []).map((dest: DestDistributionRow, i: number) => {
                  const dc = dest.dest_country
                  const name = dc?.name
                  const fallback = displayLocalized(name) || 'Inconnu'
                  return (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm inline-flex items-center gap-2 min-w-0">
                        {dc && typeof dc === 'object' ? (
                          <CountryNameWithFlag country={dc} flagSize="sm" />
                        ) : (
                          fallback
                        )}
                      </span>
                      <Badge variant="secondary">{dest.count}</Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                Dossiers en retard (&gt; {overdue?.threshold_days ?? 14} jours)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(overdue?.shipments ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Aucun dossier en retard.</p>
              ) : (
                <div className="space-y-2">
                  {(overdue?.shipments ?? []).map((s: OverdueTabShipment) => (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b">
                      <div>
                        <span className="text-sm font-medium">{s.public_tracking}</span>
                        <p className="text-xs text-muted-foreground">{displayLocalized(s.creator?.name)}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
