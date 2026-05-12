import { useState } from 'react'
import { motion } from 'framer-motion'
import { useFinanceAnalytics } from '@/hooks/useSav'
import { useFormatMoney } from '@/hooks/useSettings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'

const SERVICE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
const SERVICE_LABELS: Record<string, string> = { expedition: 'Expéditions', other: 'Autres', achat_assiste: 'Achat assisté', livraison: 'Livraisons' }

export default function FinanceAnalyticsPage() {
  const [period, setPeriod] = useState('month')
  const { data, isLoading } = useFinanceAnalytics({ period })
  const { formatMoney } = useFormatMoney()

  const kpis = data?.kpis
  const monthly = data?.monthly_revenue ?? []
  const byService = data?.by_service ?? []
  const topClients = data?.top_clients ?? []

  if (isLoading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}</div>

  const totalService = byService.reduce((s: number, x: { total: number }) => s + Number(x.total ?? 0), 0)

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytique Finance</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
            <SelectItem value="year">Cette année</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* KPIs */}
      {kpis && (
        <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {[
            { label: 'Facturé', value: formatMoney(kpis.total_invoiced), color: 'text-foreground' },
            { label: 'Encaissé', value: formatMoney(kpis.total_paid), color: 'text-emerald-600' },
            { label: 'En attente', value: formatMoney(kpis.total_pending), color: 'text-amber-600' },
            { label: 'En retard', value: formatMoney(kpis.total_overdue), color: 'text-red-600' },
            { label: 'Taux encaissement', value: `${kpis.collection_rate}%`, color: 'text-blue-600' },
            { label: 'Remboursements', value: formatMoney(kpis.refunds), color: 'text-purple-600' },
            { label: 'Délai moy. paiement', value: `${kpis.avg_payment_days ?? 0}j`, color: 'text-muted-foreground' },
          ].map(k => (
            <Card key={k.label}>
              <CardContent className="py-4 text-center">
                <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* CA Evolution + Répartition services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-sm">Évolution CA (6 mois)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip formatter={(val: number) => formatMoney(val)} />
                  <Legend />
                  <Bar dataKey="invoiced" name="Facturé" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collected" name="Encaissé" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader><CardTitle className="text-sm">Répartition services</CardTitle></CardHeader>
            <CardContent>
              {byService.length > 0 ? (
                <>
                  <div className="flex justify-center mb-4">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={byService.map((s: { service: string; total: number }) => ({ ...s, name: SERVICE_LABELS[s.service] ?? s.service }))}
                          dataKey="total"
                          nameKey="name"
                          outerRadius={70}
                          label={({ name, total }: { name: string; total: number }) => {
                            const pct = totalService > 0 ? Math.round(100 * total / totalService) : 0
                            return `${name} ${pct}%`
                          }}
                        >
                          {byService.map((_: unknown, i: number) => <Cell key={i} fill={SERVICE_COLORS[i % SERVICE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(val: number) => formatMoney(val)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {byService.map((s: { service: string; total: number }, i: number) => {
                      const pct = totalService > 0 ? Math.round(100 * Number(s.total) / totalService) : 0
                      return (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: SERVICE_COLORS[i % SERVICE_COLORS.length] }} />
                          <span className="flex-1">{SERVICE_LABELS[s.service] ?? s.service}</span>
                          <span className="font-medium tabular-nums">{pct}%</span>
                          <span className="text-muted-foreground tabular-nums">{formatMoney(Number(s.total))}</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">Aucune donnée</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top 10 clients */}
      {topClients.length > 0 && (
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader><CardTitle className="text-sm">Top 10 clients ce mois</CardTitle></CardHeader>
            <CardContent>
              <div className="hidden min-w-0 md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b">
                      <th className="py-2 pr-4 w-8">#</th>
                      <th className="py-2 pr-4">Nom</th>
                      <th className="py-2 pr-4 text-right">CA</th>
                      <th className="py-2 text-right">Factures</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topClients.map((c: { id: number; name: string; total_amount: number; invoice_count: number }, i: number) => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2.5 pr-4 text-muted-foreground">{i + 1}</td>
                        <td className="py-2.5 pr-4 font-medium">{c.name}</td>
                        <td className="py-2.5 pr-4 text-right font-semibold tabular-nums">{formatMoney(Number(c.total_amount))}</td>
                        <td className="py-2.5 text-right tabular-nums">{c.invoice_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="min-w-0 space-y-2 md:hidden">
                {topClients.map((c: { id: number; name: string; total_amount: number; invoice_count: number }, i: number) => (
                  <div key={c.id} className="rounded-lg border bg-card p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-muted-foreground">#{i + 1}</span>
                      <span className="text-right font-semibold tabular-nums">{formatMoney(Number(c.total_amount))}</span>
                    </div>
                    <p className="mt-1 font-medium break-words">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.invoice_count} facture(s)</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
