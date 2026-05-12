import { useState } from 'react'
import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart2,
  ShoppingBag,
  Bell,
  RefreshCw,
  MessageCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CurrencyIcon } from '@/components/ui/CurrencyIcon'
import { useFormatMoney } from '@/hooks/settings/useBranding'
import { useAssistedPurchaseAnalytics } from '@/hooks/useQuoteFollowUp'

export default function AssistedPurchaseAnalyticsPage() {
  const { formatMoney } = useFormatMoney()
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

  const { data, isLoading, refetch } = useAssistedPurchaseAnalytics(from, to)

  const weekly: Record<string, { total: number; accepted: number; refused: number; expired: number }> =
    data?.weekly_breakdown ?? {}
  const weeklyEntries = Object.entries(weekly)
  const maxWeeklyTotal = Math.max(...weeklyEntries.map(([, v]) => v.total), 1)

  return (
    <div className="space-y-6">
      <div className="bg-linear-to-r from-[#073763] to-[#0b5394] rounded-xl p-8 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-light mb-2">Analytique — achat assisté</h1>
            <p className="text-white/80 font-light">
              Métriques de performance du module achat assisté.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => refetch()}
          >
            <RefreshCw size={14} className="mr-1.5" /> Actualiser
          </Button>
        </div>
      </div>

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
                  onChange={(e) => { setFrom(e.target.value); setActiveRange('custom') }}
                  className="h-8 text-sm w-36"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Au</Label>
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => { setTo(e.target.value); setActiveRange('custom') }}
                  className="h-8 text-sm w-36"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Devis envoyés
                </CardTitle>
                <div className="p-3 bg-[#073763]/5 rounded-xl">
                  <ShoppingBag className="h-6 w-6 text-[#073763]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-light text-[#073763]">{data?.quotes_sent ?? 0}</div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Taux d'acceptation
                </CardTitle>
                <div className="p-3 bg-[#073763]/5 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-[#073763]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-light text-[#073763]">
                  {data?.acceptance_rate != null ? `${data.acceptance_rate}%` : '—'}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  CA en commandes
                </CardTitle>
                <div className="p-3 bg-[#073763]/5 rounded-xl">
                  <CurrencyIcon className="h-6 w-6 text-[#073763]" size={24} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-light text-[#073763]">
                  {formatMoney(data?.total_revenue ?? 0, { min: 0, max: 0 })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Délai réponse
                </CardTitle>
                <div className="p-3 bg-[#073763]/5 rounded-xl">
                  <Clock className="h-6 w-6 text-[#073763]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-light text-[#073763]">
                  {data?.avg_response_days != null ? `${data.avg_response_days}j` : '—'}
                </div>
                <p className="text-sm text-gray-500">en moyenne</p>
              </CardContent>
            </Card>
          </div>

          {weeklyEntries.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart2 size={16} />
                  Évolution hebdomadaire des devis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {weeklyEntries.map(([week, v]) => {
                    const decidedTotal = v.accepted + v.refused + v.expired
                    const weekRate = decidedTotal > 0 ? Math.round((v.accepted / decidedTotal) * 100) : null

                    return (
                      <div key={week} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Semaine du {new Date(week).toLocaleDateString('fr-FR')}</span>
                          <div className="flex items-center gap-2">
                            <span>{v.total} demande(s)</span>
                            {weekRate !== null && (
                              <Badge variant="secondary" className="text-xs">{weekRate}% conv.</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex h-4 overflow-hidden rounded-full bg-muted">
                          {v.accepted > 0 && (
                            <div className="bg-green-500 transition-all" style={{ width: `${(v.accepted / maxWeeklyTotal) * 100}%` }} />
                          )}
                          {v.refused > 0 && (
                            <div className="bg-red-400 transition-all" style={{ width: `${(v.refused / maxWeeklyTotal) * 100}%` }} />
                          )}
                          {v.expired > 0 && (
                            <div className="bg-orange-400 transition-all" style={{ width: `${(v.expired / maxWeeklyTotal) * 100}%` }} />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Acceptés
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" /> Refusés
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-orange-400 inline-block" /> Expirés
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingBag size={16} /> Top marchands
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(data?.top_merchants ?? []).map((m: { name: string; percentage: number }, i: number) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{m.name}</span>
                        <span className="text-muted-foreground">{m.percentage}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-[#073763] rounded-full transition-all"
                          style={{ width: `${m.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {(data?.top_merchants ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <XCircle size={16} /> Motifs de refus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(data?.refusal_reasons ?? []).map((r: { reason: string; percentage: number }, i: number) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{r.reason}</span>
                        <span className="text-muted-foreground">{r.percentage}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-red-400 rounded-full transition-all"
                          style={{ width: `${r.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {(data?.refusal_reasons ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell size={16} /> Efficacité des relances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="text-center rounded-lg border p-4">
                    <p className="text-2xl font-bold text-[#073763]">
                      {data?.reminder_effectiveness?.after_reminder_1 ?? 0}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Conversion après relance 1</p>
                  </div>
                  <div className="text-center rounded-lg border p-4">
                    <p className="text-2xl font-bold text-[#073763]">
                      {data?.reminder_effectiveness?.after_reminder_2 ?? 0}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Conversion après relance 2</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageCircle size={16} /> Clarifications requises
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-[#073763]">
                    {data?.clarification_rate != null ? `${data.clarification_rate}%` : '—'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    des dossiers passent par une demande de clarification d'attributs
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
