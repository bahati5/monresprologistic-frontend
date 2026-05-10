import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api from '@/api/client'
import { useAuthStore } from '@/stores/authStore'
import { DashboardHero } from '@/components/dashboard/DashboardHero'
import { DashboardChartsSection } from '@/components/dashboard/DashboardChartsSection'
import { DashboardKpiSection } from '@/components/dashboard/DashboardKpiSection'
import { DashboardOperatorCard } from '@/components/dashboard/DashboardOperatorCard'
import { DashboardRecentActivityCard } from '@/components/dashboard/DashboardRecentActivityCard'
import { DashboardRecentShipments, type RecentShipmentRow } from '@/components/dashboard/DashboardRecentShipments'
import { DashboardStaffQuickLinks } from '@/components/dashboard/DashboardStaffQuickLinks'
import { DashboardTodayActionsCard, type DashboardTodayAction } from '@/components/dashboard/DashboardTodayActionsCard'
import { getGreeting, isStaffDashboard } from '@/components/dashboard/dashboardUtils'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import {
  Bell, CreditCard, Truck, Plus, ShoppingBag,
} from 'lucide-react'
import { type TimelineEvent } from '@/components/workflow/TimelineLog'
import { useFormatMoney } from '@/hooks/useSettings'
import { DraftsList } from '@/components/drafts/DraftsList'

export default function Dashboard() {
  const { user } = useAuthStore()
  const { formatMoney } = useFormatMoney()

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
  const recentShipments: RecentShipmentRow[] = data?.recent_shipments ?? []

  const todayActions: DashboardTodayAction[] = []
  if ((stats.pickups_count ?? stats.pickups_today ?? 0) > 0)
    todayActions.push({
      label: `${stats.pickups_count ?? stats.pickups_today} pickup(s) a traiter`,
      href: '/pickups',
      icon: Truck,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    })
  if ((stats.payment_proofs_pending ?? 0) > 0)
    todayActions.push({
      label: `${stats.payment_proofs_pending} paiement(s) a valider`,
      href: '/finance/payment-proofs',
      icon: CreditCard,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
    })
  if ((stats.pre_alerts ?? stats.pre_alerts_pending ?? 0) > 0)
    todayActions.push({
      label: `${stats.pre_alerts ?? stats.pre_alerts_pending} colis attendu(s) en attente`,
      href: '/shipment-notices',
      icon: Bell,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    })

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
            { label: 'Shopping Assiste', href: '/shopping-assiste/nouveau', icon: ShoppingBag },
            { label: 'Demander un pickup', href: '/pickups/create', icon: Truck, variant: 'outline' },
            { label: 'Nouveau Colis Attendu', href: '/shipment-notices/create', icon: Bell, variant: 'outline' },
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

      {isStaffDashboard(dashboardType) && <DashboardTodayActionsCard actions={todayActions} />}

      {isStaffDashboard(dashboardType) && <DashboardStaffQuickLinks />}

      {isStaffDashboard(dashboardType) && (
        <DashboardKpiSection
          dashboardType={dashboardType}
          stats={stats}
          formatMoney={formatMoney}
        />
      )}

      {dashboardType === 'client' && (
        <DashboardKpiSection
          dashboardType={dashboardType}
          stats={stats}
          clientExtras={{ preAlertsCount: data?.preAlertsCount }}
          formatMoney={formatMoney}
        />
      )}

      {dashboardType === 'driver' && (
        <DashboardKpiSection dashboardType={dashboardType} stats={stats} formatMoney={formatMoney} />
      )}

      {dashboardType === 'operator' && (
        <DashboardOperatorCard packagesToday={stats.packages_today ?? 0} />
      )}

      {(isStaffDashboard(dashboardType) || dashboardType === 'client') && (
        <motion.div variants={fadeInUp}>
          <DraftsList />
        </motion.div>
      )}

      {isStaffDashboard(dashboardType) && <DashboardRecentShipments shipments={recentShipments} />}

      {isStaffDashboard(dashboardType) && (
        <DashboardChartsSection
          monthlyEvolution={monthlyEvolution}
          statusDistribution={statusDistribution}
        />
      )}

      {isStaffDashboard(dashboardType) && (
        <DashboardRecentActivityCard events={recentActivity} />
      )}
    </motion.div>
  )
}
