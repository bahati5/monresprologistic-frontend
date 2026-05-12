import { motion } from 'framer-motion'
import { useFinanceDashboard } from '@/hooks/useFinance'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Coins, TrendingUp, CreditCard, Receipt,
  ArrowUpRight, ArrowDownRight,
  type LucideIcon,
} from 'lucide-react'
import { displayLocalized } from '@/lib/localizedString'
import { useFormatMoney } from '@/hooks/useSettings'

interface RecentInvoiceRow {
  id: number
  reference?: string
  amount?: number
  status?: string
  client_name?: unknown
  client?: { name?: unknown }
}

interface RecentPaymentRow {
  id: number
  amount?: number
  method?: string
  created_at?: string
  client_name?: unknown
  user?: { name?: unknown }
}

interface MonthlyBreakdownRow {
  month?: string
  invoiced?: number
  paid?: number
  balance?: number
}

interface FinanceDashboardData extends Record<string, unknown> {
  total_revenue?: number
  revenue_trend?: number
  total_receivables?: number
  total_paid?: number
  paid_trend?: number
  recent_invoices?: RecentInvoiceRow[]
  recent_payments?: RecentPaymentRow[]
  monthly_breakdown?: MonthlyBreakdownRow[]
}

function StatCard({ title, value, icon: Icon, trend, trendLabel, color }: {
  title: string; value: string | number; icon: LucideIcon; trend?: number; trendLabel?: string; color: string
}) {
  const isPositive = (trend ?? 0) >= 0
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                {isPositive ? <ArrowUpRight size={14} className="text-emerald-500" /> : <ArrowDownRight size={14} className="text-red-500" />}
                <span className={`text-xs font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                  {Math.abs(trend)}%
                </span>
                {trendLabel && <span className="text-xs text-muted-foreground">{trendLabel}</span>}
              </div>
            )}
          </div>
          <div className="p-3 rounded-xl" style={{ backgroundColor: color + '15' }}>
            <Icon className="h-6 w-6" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function FinanceDashboardPage() {
  const { data, isLoading } = useFinanceDashboard()
  const { formatMoney } = useFormatMoney()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Tableau de bord financier</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Card key={i} className="animate-pulse h-32" />)}
        </div>
      </div>
    )
  }

  const d = (data || {}) as FinanceDashboardData

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord financier</h1>
        <p className="text-sm text-muted-foreground">Vue d'ensemble des finances et paiements</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Chiffre d'affaires"
          value={formatMoney(Number(d.total_revenue ?? 0))}
          icon={Coins}
          trend={d.revenue_trend}
          trendLabel="vs mois dernier"
          color="#0e7490"
        />
        <StatCard
          title="Creances clients"
          value={formatMoney(Number(d.total_receivables ?? 0))}
          icon={Receipt}
          color="#f59e0b"
        />
        <StatCard
          title="Paiements recus"
          value={formatMoney(Number(d.total_paid ?? 0))}
          icon={CreditCard}
          trend={d.paid_trend}
          trendLabel="vs mois dernier"
          color="#10b981"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt size={16} className="text-primary" /> Dernieres factures
            </CardTitle>
          </CardHeader>
          <CardContent>
            {d.recent_invoices && d.recent_invoices.length > 0 ? (
              <div className="space-y-2">
                {d.recent_invoices.map((inv: RecentInvoiceRow) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{inv.reference || `INV-${inv.id}`}</p>
                      <p className="text-xs text-muted-foreground">{displayLocalized(inv.client_name || inv.client?.name)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">
                        {formatMoney(Number(inv.amount ?? 0))}
                      </p>
                      <Badge variant={inv.status === 'paid' ? 'default' : 'secondary'} className="text-xs mt-0.5">
                        {inv.status === 'paid' ? 'Payee' : inv.status === 'partial' ? 'Partielle' : 'En attente'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Aucune facture recente</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard size={16} className="text-emerald-500" /> Derniers paiements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {d.recent_payments && d.recent_payments.length > 0 ? (
              <div className="space-y-2">
                {d.recent_payments.map((pay: RecentPaymentRow) => (
                  <div key={pay.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{displayLocalized(pay.client_name || pay.user?.name)}</p>
                      <p className="text-xs text-muted-foreground">
                        {pay.method} —{' '}
                        {pay.created_at ? new Date(pay.created_at).toLocaleDateString('fr-FR') : '—'}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-emerald-600">
                      +{formatMoney(Number(pay.amount ?? 0))}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun paiement recent</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      {d.monthly_breakdown && d.monthly_breakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" /> Recapitulatif mensuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="hidden min-w-0 md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Mois</th>
                    <th className="px-4 py-3 text-right font-medium">Facture</th>
                    <th className="px-4 py-3 text-right font-medium">Paye</th>
                    <th className="px-4 py-3 text-right font-medium">Solde</th>
                  </tr>
                </thead>
                <tbody>
                  {d.monthly_breakdown.map((m: MonthlyBreakdownRow, i: number) => (
                    <tr key={i} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{m.month}</td>
                      <td className="px-4 py-3 text-right">
                        {formatMoney(Number(m.invoiced ?? 0))}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600">
                        {formatMoney(Number(m.paid ?? 0))}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatMoney(Number(m.balance ?? 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="min-w-0 space-y-2 md:hidden">
              {d.monthly_breakdown.map((m: MonthlyBreakdownRow, i: number) => (
                <div key={i} className="rounded-lg border bg-card p-3 text-sm">
                  <p className="font-medium">{m.month}</p>
                  <dl className="mt-2 grid grid-cols-1 gap-1 text-xs sm:grid-cols-3">
                    <div>
                      <dt className="text-muted-foreground">Facturé</dt>
                      <dd className="font-semibold tabular-nums">{formatMoney(Number(m.invoiced ?? 0))}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Payé</dt>
                      <dd className="font-semibold tabular-nums text-emerald-600">{formatMoney(Number(m.paid ?? 0))}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Solde</dt>
                      <dd className="font-semibold tabular-nums">{formatMoney(Number(m.balance ?? 0))}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}
