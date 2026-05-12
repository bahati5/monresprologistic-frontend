import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, Package, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { displayLocalized } from '@/lib/localizedString'
import { CountryNameWithFlag } from '@/components/CountryNameWithFlag'

interface OverdueShipmentRow {
  id: number
  public_tracking?: string
  created_at?: string
  creator?: { name?: unknown }
  dest_country?: Record<string, unknown>
  status?: string | { label?: string; value?: string }
}

interface PaginatedOverdueResponse {
  overdue_count?: number
  shipments?: OverdueShipmentRow[]
}

export default function OverdueDashboardPage() {
  const [threshold, setThreshold] = useState(14)
  const [asOfMs] = useState(() => Date.now())

  const { data: overduePayload, isLoading, refetch } = useQuery({
    queryKey: ['overdue-dashboard', threshold],
    queryFn: () => api.get(`/api/dashboard/overdue?threshold=${threshold}`).then(r => r.data),
  })

  const overdueData = overduePayload as PaginatedOverdueResponse | undefined
  const shipments: OverdueShipmentRow[] = overdueData?.shipments ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            Dossiers en retard
          </h1>
          <p className="text-muted-foreground text-sm">
            Expéditions sans mise à jour de statut depuis plus de {threshold} jours.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Seuil (jours) :</span>
          <Input
            type="number"
            value={threshold}
            onChange={e => setThreshold(Number(e.target.value))}
            className="w-20 h-8 text-sm"
            min={1}
            max={365}
          />
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw size={14} className="mr-1.5" />Actualiser
          </Button>
        </div>
      </div>

      {overdueData && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-orange-900">{overdueData.overdue_count ?? 0}</p>
                <p className="text-xs text-orange-700">Dossiers en retard</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{threshold}</p>
                <p className="text-xs text-muted-foreground">Jours seuil</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Package className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{shipments.length}</p>
                <p className="text-xs text-muted-foreground">Affichés</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Liste des expéditions en retard</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Suivi</th>
                  <th className="px-4 py-3 text-left font-medium">Client</th>
                  <th className="px-4 py-3 text-left font-medium">Destination</th>
                  <th className="px-4 py-3 text-left font-medium">Statut actuel</th>
                  <th className="px-4 py-3 text-left font-medium">Créé le</th>
                  <th className="px-4 py-3 text-left font-medium">Jours écoulés</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b">
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-muted" /></td>
                      ))}
                    </tr>
                  ))
                ) : shipments.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center">
                    <Package size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground">Aucun dossier en retard — excellente performance !</p>
                  </td></tr>
                ) : shipments.map((s: OverdueShipmentRow) => {
                  const createdMs = s.created_at ? new Date(s.created_at).getTime() : asOfMs
                  const daysOld = Math.floor((asOfMs - createdMs) / (1000 * 60 * 60 * 24))
                  return (
                    <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/shipments/${s.id}`} className="text-primary hover:underline font-mono text-xs">
                          {s.public_tracking}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{displayLocalized(s.creator?.name) ?? '—'}</td>
                      <td className="px-4 py-3">
                        {s.dest_country && typeof s.dest_country === 'object' ? (
                          <CountryNameWithFlag country={s.dest_country} flagSize="sm" />
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {typeof s.status === 'string' ? s.status : s.status?.label ?? s.status?.value ?? '—'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs ${daysOld > 30 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                          {daysOld} j
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="min-w-0 divide-y md:hidden">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="p-4">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="mt-2 h-3 w-full animate-pulse rounded bg-muted" />
                </div>
              ))
            ) : shipments.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-12 text-center text-muted-foreground">
                <Package size={40} className="mb-3 opacity-30" />
                <p>Aucun dossier en retard — excellente performance !</p>
              </div>
            ) : (
              shipments.map((s: OverdueShipmentRow) => {
                const createdMs = s.created_at ? new Date(s.created_at).getTime() : asOfMs
                const daysOld = Math.floor((asOfMs - createdMs) / (1000 * 60 * 60 * 24))
                return (
                  <div key={s.id} className="space-y-2 p-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link to={`/shipments/${s.id}`} className="font-mono text-xs font-semibold text-primary hover:underline break-all">
                        {s.public_tracking}
                      </Link>
                      <Badge className={`text-xs ${daysOld > 30 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                        {daysOld} jour(s)
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Client : </span>
                      {displayLocalized(s.creator?.name) ?? '—'}
                    </p>
                    <div className="text-xs">
                      <span className="font-medium text-foreground">Destination : </span>
                      {s.dest_country && typeof s.dest_country === 'object' ? (
                        <CountryNameWithFlag country={s.dest_country} flagSize="sm" />
                      ) : (
                        '—'
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {typeof s.status === 'string' ? s.status : s.status?.label ?? s.status?.value ?? '—'}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Créé le {s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : '—'}
                    </p>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
