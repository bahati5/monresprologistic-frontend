import { motion } from 'framer-motion'
import { useFinanceDashboard } from '@/hooks/useFinance'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard, Receipt,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import { displayLocalized } from '@/lib/localizedString'

function StatCard({ title, value, icon: Icon, trend, trendLabel, color }: {
  title: string; value: string | number; icon: any; trend?: number; trendLabel?: string; color: string
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Tableau de bord financier</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Card key={i} className="animate-pulse h-32" />)}
        </div>
      </div>
    )
  }

  const d = data || {} as any

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord financier</h1>
        <p className="text-sm text-muted-foreground">Vue d'ensemble des finances et paiements</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Chiffre d'affaires"
          value={`${d.total_revenue ?? 0}`}
          icon={DollarSign}
          trend={d.revenue_trend}
          trendLabel="vs mois dernier"
          color="#0e7490"
        />
        <StatCard
          title="Creances clients"
          value={`${d.total_receivables ?? 0}`}
          icon={Receipt}
          color="#f59e0b"
        />
        <StatCard
          title="Paiements recus"
          value={`${d.total_paid ?? 0}`}
          icon={CreditCard}
          trend={d.paid_trend}
          trendLabel="vs mois dernier"
          color="#10b981"
        />
        <StatCard
          title="Solde portefeuilles"
          value={`${d.total_wallet_balance ?? 0}`}
          icon={Wallet}
          color="#8b5cf6"
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
                {d.recent_invoices.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{inv.reference || `INV-${inv.id}`}</p>
                      <p className="text-xs text-muted-foreground">{displayLocalized(inv.client_name || inv.client?.name)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{inv.amount}</p>
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
                {d.recent_payments.map((pay: any) => (
                  <div key={pay.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{displayLocalized(pay.client_name || pay.user?.name)}</p>
                      <p className="text-xs text-muted-foreground">{pay.method} — {new Date(pay.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <p className="text-sm font-bold text-emerald-600">+{pay.amount}</p>
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
            <div className="overflow-x-auto">
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
                  {d.monthly_breakdown.map((m: any, i: number) => (
                    <tr key={i} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{m.month}</td>
                      <td className="px-4 py-3 text-right">{m.invoiced}</td>
                      <td className="px-4 py-3 text-right text-emerald-600">{m.paid}</td>
                      <td className="px-4 py-3 text-right font-medium">{m.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}
