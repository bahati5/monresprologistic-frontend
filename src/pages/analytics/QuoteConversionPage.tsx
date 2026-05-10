import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, CheckCircle2, XCircle, Clock, RefreshCw, BarChart2, AlertCircle } from 'lucide-react'

export default function QuoteConversionPage() {
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [from, setFrom] = useState(() => {
    const end = new Date()
    return new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  })
  const [activeRange, setActiveRange] = useState<'30d' | '60d' | '90d' | 'custom'>('30d')

  const setPreset = (days: number, key: '30d' | '60d' | '90d') => {
    const end = new Date()
    setTo(end.toISOString().slice(0, 10))
    setFrom(new Date(end.getTime() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
    setActiveRange(key)
  }

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['quote-conversion', from, to],
    queryFn: () =>
      api.get('/api/analytics/quote-conversion', { params: { from, to } }).then(r => r.data),
  })

  const conversionRate = data?.conversion_rate
  const weekly: Record<string, { total: number; accepted: number; refused: number; expired: number }> =
    data?.weekly_breakdown ?? {}

  const weeklyEntries = Object.entries(weekly)

  const maxWeeklyTotal = Math.max(...weeklyEntries.map(([, v]) => v.total), 1)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Taux de conversion des devis
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Analyse des devis d'achat assisté : acceptés, refusés, expirés
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw size={14} className="mr-1.5" />Actualiser
        </Button>
      </div>

      {/* Filtres de période */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex gap-2">
              {([['30d', 30], ['60d', 60], ['90d', 90]] as const).map(([key, days]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={activeRange === key ? 'default' : 'outline'}
                  onClick={() => setPreset(days, key)}
                >
                  {key}
                </Button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Du</Label>
                <Input
                  type="date"
                  value={from}
                  onChange={e => { setFrom(e.target.value); setActiveRange('custom') }}
                  className="h-8 text-sm w-36"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Au</Label>
                <Input
                  type="date"
                  value={to}
                  onChange={e => { setTo(e.target.value); setActiveRange('custom') }}
                  className="h-8 text-sm w-36"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="h-8 w-16 animate-pulse rounded bg-muted mb-2" />
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="lg:col-span-1 border-primary/20 bg-primary/5">
              <CardContent className="p-5 text-center">
                <p className="text-4xl font-bold text-primary">
                  {conversionRate !== null ? `${conversionRate}%` : '—'}
                </p>
                <p className="text-sm text-muted-foreground mt-1 font-medium">Taux de conversion</p>
                <p className="text-xs text-muted-foreground">acceptés / (acceptés + refusés + expirés)</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                  <span className="text-sm font-medium text-muted-foreground">Acceptés</span>
                </div>
                <p className="text-3xl font-bold text-green-600">{data?.accepted ?? 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle size={16} className="text-red-500 shrink-0" />
                  <span className="text-sm font-medium text-muted-foreground">Refusés</span>
                </div>
                <p className="text-3xl font-bold text-red-600">{data?.refused ?? 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle size={16} className="text-orange-500 shrink-0" />
                  <span className="text-sm font-medium text-muted-foreground">Expirés</span>
                </div>
                <p className="text-3xl font-bold text-orange-600">{data?.expired ?? 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={16} className="text-blue-500 shrink-0" />
                  <span className="text-sm font-medium text-muted-foreground">En cours</span>
                </div>
                <p className="text-3xl font-bold text-blue-600">{data?.pending ?? 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Évolution hebdomadaire */}
          {weeklyEntries.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart2 size={16} />
                  Évolution hebdomadaire
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {weeklyEntries.map(([week, v]) => {
                    const decidedTotal = v.accepted + v.refused + v.expired
                    const weekRate = decidedTotal > 0
                      ? Math.round((v.accepted / decidedTotal) * 100)
                      : null

                    return (
                      <div key={week} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Semaine du {new Date(week).toLocaleDateString('fr-FR')}</span>
                          <div className="flex items-center gap-2">
                            <span>{v.total} demande(s)</span>
                            {weekRate !== null && (
                              <Badge variant="secondary" className="text-xs">
                                {weekRate}% conv.
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex h-4 overflow-hidden rounded-full bg-muted">
                          {v.accepted > 0 && (
                            <div
                              className="bg-green-500 transition-all"
                              style={{ width: `${(v.accepted / maxWeeklyTotal) * 100}%` }}
                            />
                          )}
                          {v.refused > 0 && (
                            <div
                              className="bg-red-400 transition-all"
                              style={{ width: `${(v.refused / maxWeeklyTotal) * 100}%` }}
                            />
                          )}
                          {v.expired > 0 && (
                            <div
                              className="bg-orange-400 transition-all"
                              style={{ width: `${(v.expired / maxWeeklyTotal) * 100}%` }}
                            />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />Acceptés
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />Refusés
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-orange-400 inline-block" />Expirés
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
