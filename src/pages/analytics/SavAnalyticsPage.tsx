import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSavAnalytics } from '@/hooks/useSav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

export default function SavAnalyticsPage() {
  const [period, setPeriod] = useState('month')
  const { data, isLoading } = useSavAnalytics({ period })

  const kpis = data?.kpis
  const byCategory = data?.by_category ?? []
  const byChannel = data?.by_channel ?? []
  const byAgent = data?.by_agent ?? []
  const slaPriority = (data as Record<string, unknown>)?.sla_by_priority as Array<{
    priority: string; target: string; respected: number; total: number; rate: number
  }> ?? []

  if (isLoading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}</div>

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">SAV — Analytique détaillée</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
            <SelectItem value="year">Cette année</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Volume et performance */}
      {kpis && (
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Volume et performance</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Tickets créés', value: kpis.total_created, color: '' },
                  { label: 'Résolus', value: `${kpis.resolved} (${kpis.resolved_rate}%)`, color: 'text-emerald-600' },
                  { label: 'SLA respecté', value: `${kpis.sla_rate}%`, color: kpis.sla_rate >= 90 ? 'text-emerald-600' : 'text-amber-600' },
                  { label: 'Résolution moy.', value: `${kpis.avg_resolution_hours}h`, color: '' },
                ].map(k => (
                  <div key={k.label} className="text-center p-3 rounded-lg bg-muted/50">
                    <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Par catégorie + Par canal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader><CardTitle className="text-sm">Par catégorie</CardTitle></CardHeader>
            <CardContent>
              {byCategory.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={byCategory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {byCategory.map((c, i) => {
                      const total = byCategory.reduce((s, x) => s + x.count, 0)
                      const pct = total > 0 ? Math.round(100 * c.count / total) : 0
                      return (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <div className="h-2 rounded-full bg-muted flex-1 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-muted-foreground w-32 truncate">{c.category}</span>
                          <span className="tabular-nums font-medium w-10 text-right">{pct}%</span>
                          <span className="tabular-nums text-muted-foreground w-16 text-right">{c.count} tickets</span>
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

        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader><CardTitle className="text-sm">Par canal d'entrée</CardTitle></CardHeader>
            <CardContent>
              {byChannel.length > 0 ? (
                <>
                  <div className="flex justify-center">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={byChannel} dataKey="count" nameKey="channel" outerRadius={80} label={({ channel, count }) => `${channel}: ${count}`}>
                          {byChannel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 space-y-2">
                    {byChannel.map((ch, i) => {
                      const total = byChannel.reduce((s, x) => s + x.count, 0)
                      const pct = total > 0 ? Math.round(100 * ch.count / total) : 0
                      return (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="capitalize flex-1">{ch.channel}</span>
                          <div className="h-2 rounded-full bg-muted w-24 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                          </div>
                          <span className="tabular-nums font-medium w-10 text-right">{pct}%</span>
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

      {/* SLA par priorité (PRD 7.4) */}
      {slaPriority.length > 0 && (
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader><CardTitle className="text-sm">SLA par priorité</CardTitle></CardHeader>
            <CardContent>
              <div className="hidden min-w-0 md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b">
                      <th className="py-2 pr-6">Priorité</th>
                      <th className="py-2 pr-6">Objectif</th>
                      <th className="py-2 pr-6">Respecté</th>
                      <th className="py-2 pr-6">Taux</th>
                      <th className="py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {slaPriority.map(sp => (
                      <tr key={sp.priority} className="border-b last:border-0">
                        <td className="py-3 pr-6 capitalize font-medium">{sp.priority === 'low' ? 'Faible' : sp.priority === 'normal' ? 'Normal' : 'Urgent'}</td>
                        <td className="py-3 pr-6 text-muted-foreground">{sp.target}</td>
                        <td className="py-3 pr-6">{sp.respected}/{sp.total}</td>
                        <td className="py-3 pr-6 font-semibold">{sp.rate}%</td>
                        <td className="py-3">
                          <Badge variant={sp.rate >= 90 ? 'default' : sp.rate >= 70 ? 'secondary' : 'destructive'} className="text-[10px]">
                            {sp.rate >= 90 ? 'OK' : 'Attention'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="min-w-0 space-y-2 md:hidden">
                {slaPriority.map((sp) => (
                  <div key={sp.priority} className="rounded-lg border bg-card p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium capitalize">
                        {sp.priority === 'low' ? 'Faible' : sp.priority === 'normal' ? 'Normal' : 'Urgent'}
                      </span>
                      <Badge variant={sp.rate >= 90 ? 'default' : sp.rate >= 70 ? 'secondary' : 'destructive'} className="text-[10px]">
                        {sp.rate >= 90 ? 'OK' : 'Attention'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Objectif : {sp.target}</p>
                    <p className="text-xs">Respecté : {sp.respected}/{sp.total}</p>
                    <p className="font-semibold tabular-nums">Taux : {sp.rate}%</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Performance par agent */}
      {byAgent.length > 0 && (
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader><CardTitle className="text-sm">Temps moyen par agent</CardTitle></CardHeader>
            <CardContent>
              <div className="hidden min-w-0 md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b">
                      <th className="py-2 pr-4">Agent</th>
                      <th className="py-2 pr-4">Tickets</th>
                      <th className="py-2 pr-4">Résolus</th>
                      <th className="py-2">Résolution moy.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byAgent.map(a => (
                      <tr key={a.agent_name} className="border-b last:border-0">
                        <td className="py-2.5 pr-4 font-medium">{a.agent_name}</td>
                        <td className="py-2.5 pr-4">{a.total}</td>
                        <td className="py-2.5 pr-4">{a.resolved}</td>
                        <td className="py-2.5">{a.avg_hours ? `${Math.round(a.avg_hours)}h` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="min-w-0 space-y-2 md:hidden">
                {byAgent.map((a) => (
                  <div key={a.agent_name} className="rounded-lg border bg-card p-3 text-sm">
                    <p className="font-medium break-words">{a.agent_name}</p>
                    <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <dt className="text-muted-foreground">Tickets</dt>
                        <dd className="font-medium">{a.total}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Résolus</dt>
                        <dd className="font-medium">{a.resolved}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Moy.</dt>
                        <dd className="font-medium">{a.avg_hours ? `${Math.round(a.avg_hours)}h` : '—'}</dd>
                      </div>
                    </dl>
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
