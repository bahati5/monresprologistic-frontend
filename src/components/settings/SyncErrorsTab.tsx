import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/apiError'

type SyncErrorRow = {
  id: number
  integration: string
  event_type: string
  entity_type: string | null
  entity_id: number | null
  error_message: string | null
  attempt: number
  max_attempts: number
  resolved: boolean
  next_retry_at: string | null
  created_at: string
}

export default function SyncErrorsTab() {
  const qc = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['settings-sync-errors'],
    queryFn: () => api.get('/api/settings/sync-errors', { params: { resolved: false } }).then(r => r.data),
  })

  const retryMutation = useMutation({
    mutationFn: (id: number) => api.post(`/api/settings/sync-errors/${id}/retry`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-sync-errors'] })
      toast.success('Nouvelle tentative planifiée.')
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Échec du retry.')),
  })

  const resolveMutation = useMutation({
    mutationFn: (id: number) => api.post(`/api/settings/sync-errors/${id}/resolve`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-sync-errors'] })
      toast.success('Erreur marquée comme résolue.')
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Action impossible.')),
  })

  const paginator = data?.sync_errors
  const rows: SyncErrorRow[] = paginator?.data ?? []

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> Impossible de charger les erreurs
          </CardTitle>
          <CardDescription>Vérifiez vos droits (paramètres système) ou réessayez.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Erreurs de synchronisation</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Intégrations Odoo, Freshsales, FlexPay — relance manuelle ou résolution après correction côté ERP.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>File d&apos;attente</CardTitle>
            <CardDescription>Entrées non résolues (dernières en premier).</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => qc.invalidateQueries({ queryKey: ['settings-sync-errors'] })}
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Actualiser
          </Button>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Aucune erreur ouverte.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {rows.map((row) => (
                <li key={row.id} className="p-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{row.integration}</Badge>
                      <span className="text-xs font-mono text-muted-foreground truncate">{row.event_type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{row.error_message ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">
                      Tentative {row.attempt}/{row.max_attempts}
                      {row.next_retry_at && ` · prochain retry : ${new Date(row.next_retry_at).toLocaleString('fr-FR')}`}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={retryMutation.isPending}
                      onClick={() => retryMutation.mutate(row.id)}
                    >
                      {retryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Relancer'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={resolveMutation.isPending}
                      onClick={() => resolveMutation.mutate(row.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" /> Résolu
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
