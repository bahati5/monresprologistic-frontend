import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api from '@/api/client'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardHero } from '@/components/dashboard/DashboardHero'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { TimelineLog, type TimelineEvent } from '@/components/workflow/TimelineLog'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import {
  Package, Truck, DollarSign, Users, FileText,
  Bell, CreditCard, Plus, CheckCircle, Wallet,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { displayLocalized } from '@/lib/localizedString'

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4']

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon apres-midi'
  return 'Bonsoir'
}

function isStaffDashboard(type: string): boolean {
  return type === 'admin' || type === 'employee' || type === 'operator'
}

export default function Dashboard() {
  const { user } = useAuthStore()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/api/dashboard').then((r) => r.data),
    retry: false,
  })

  const dashboardType = data?.dashboard_type || 'admin'
  const stats = data?.stats || {}
  const greeting = getGreeting()

  const monthlyEvolution = data?.charts?.monthly_evolution ?? []
  const statusDistribution = data?.charts?.status_distribution ?? []
  const recentActivity: TimelineEvent[] = data?.recent_activity ?? []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 rounded-2xl bg-muted animate-shimmer" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-card border animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="font-medium text-destructive">Impossible de charger le tableau de bord</p>
        <p className="text-sm text-muted-foreground mt-1">Verifiez la connexion au serveur ou reconnectez-vous.</p>
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {isStaffDashboard(dashboardType) && (
        <DashboardHero
          title={`${greeting}, ${user?.name?.split(' ')[0] || 'Utilisateur'}`}
          subtitle="Voici un apercu de votre activite logistique. Suivez vos expeditions, vos encaissements et l'activite de vos equipes en temps reel."
          gradient={['#1e3a5f', '#2B4C7E'] as const}
          actions={[
            { label: 'Nouvelle expedition', href: '/shipments/create', icon: Plus },
            { label: 'Voir les expeditions', href: '/shipments', variant: 'outline' },
          ]}
        />
      )}

      {dashboardType === 'client' && (
        <DashboardHero
          title={`Bienvenue, ${user?.name?.split(' ')[0] || ''}`}
          subtitle="Suivez vos colis et gerez vos expeditions depuis votre espace personnel."
          gradient={['#0e7490', '#14B8A6'] as const}
          actions={[
            { label: 'Demander un pickup', href: '/pickups/create', icon: Truck },
            { label: 'Creer une pre-alerte', href: '/shipment-notices/create', icon: Plus, variant: 'outline' },
          ]}
        />
      )}

      {dashboardType === 'driver' && (
        <DashboardHero
          title={`Vos taches du jour, ${user?.name?.split(' ')[0] || ''}`}
          subtitle="Consultez vos pickups et livraisons assignees pour aujourd'hui."
          gradient={['#064e3b', '#059669'] as const}
          stats={[
            { label: 'Pickups', value: stats.pickups_pending ?? 0 },
            { label: 'Livraisons', value: stats.deliveries_pending ?? 0 },
          ]}
        />
      )}

      {isStaffDashboard(dashboardType) && (
        <motion.div variants={fadeInUp} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            title="Expeditions ce mois"
            value={stats.shipments_total ?? 0}
            icon={Package}
            color="#3B82F6"
            trend={stats.shipments_trend ?? undefined}
            trendLabel="vs mois dernier"
            href="/shipments"
            delay={0}
          />
          <KpiCard
            title="Pickups aujourd'hui"
            value={stats.pickups_count ?? stats.pickups_today ?? 0}
            icon={Truck}
            color="#10B981"
            href="/pickups"
            delay={1}
          />
          <KpiCard
            title="Pre-alertes en attente"
            value={stats.pre_alerts ?? stats.pre_alerts_pending ?? 0}
            icon={Bell}
            color="#F59E0B"
            href="/shipment-notices"
            delay={2}
          />
          <KpiCard
            title="Paiements a valider"
            value={stats.payment_proofs_pending ?? 0}
            icon={CreditCard}
            color="#EF4444"
            href="/finance/payment-proofs"
            delay={3}
          />
          <KpiCard
            title="Revenus du mois"
            value={stats.monthly_revenue ?? 0}
            icon={DollarSign}
            color="#14B8A6"
            trend={stats.revenue_trend ?? undefined}
            trendLabel="vs mois dernier"
            href="/finance/dashboard"
            delay={4}
          />
          <KpiCard
            title="Clients actifs"
            value={stats.clients_count ?? 0}
            icon={Users}
            color="#8B5CF6"
            href="/clients"
            delay={5}
          />
        </motion.div>
      )}

      {dashboardType === 'client' && (
        <motion.div variants={fadeInUp} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Mes pre-alertes" value={stats.pre_alerts ?? data?.preAlertsCount ?? 0} icon={Bell} color="#F59E0B" href="/shipment-notices" delay={0} />
          <KpiCard title="Mes achats assistes" value={stats.purchase_orders ?? 0} icon={FileText} color="#6366F1" href="/purchase-orders" delay={1} />
          <KpiCard title="Mes expeditions" value={stats.shipments_total ?? 0} icon={Package} color="#3B82F6" href="/shipments" delay={2} />
          <KpiCard title="Mon solde" value={stats.wallet_balance ?? 0} icon={Wallet} color="#14B8A6" href="/finance/wallets" delay={3} />
        </motion.div>
      )}

      {dashboardType === 'driver' && (
        <motion.div variants={fadeInUp} className="grid gap-4 md:grid-cols-3">
          <KpiCard title="Pickups en attente" value={stats.pickups_pending ?? 0} icon={Truck} color="#F59E0B" delay={0} />
          <KpiCard title="Livraisons en cours" value={stats.deliveries_pending ?? 0} icon={Package} color="#3B82F6" delay={1} />
          <KpiCard title="Completees aujourd'hui" value={stats.completed_today ?? 0} icon={CheckCircle} color="#10B981" delay={2} />
        </motion.div>
      )}

      {dashboardType === 'operator' && (
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Flux operateur</CardTitle>
              <p className="text-xs text-muted-foreground">Colis recus aujourd&apos;hui (agence)</p>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{stats.packages_today ?? 0}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {isStaffDashboard(dashboardType) && (
        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div variants={fadeInUp} className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Evolution mensuelle</CardTitle>
                <p className="text-xs text-muted-foreground">Expeditions creees et encaissements factures (6 derniers mois)</p>
              </CardHeader>
              <CardContent className="pt-2">
                {monthlyEvolution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={monthlyEvolution}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" />
                      <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(0 0% 100%)',
                          border: '1px solid hsl(220 13% 91%)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar yAxisId="left" dataKey="shipments" name="Expeditions" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={24} />
                      <Area yAxisId="right" type="monotone" dataKey="revenue" name="Revenus" stroke="#14B8A6" strokeWidth={2} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-16">Aucune expedition sur les 6 derniers mois.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Repartition par statut</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                {statusDistribution.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {statusDistribution.map((entry: { color?: string }, i: number) => (
                            <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-3 mt-2 justify-center">
                      {statusDistribution.map((s: { name: unknown; color: string }, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                          {displayLocalized(s.name)}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-16">Aucune expedition avec statut.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {isStaffDashboard(dashboardType) && (
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Activite recente</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <TimelineLog events={recentActivity} maxItems={5} />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucun historique de statut pour le moment. Les mises a jour d&apos;expeditions apparaitront ici.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
