import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { DashboardPendingDossiersCard } from '@/components/dashboard/DashboardPendingDossiersCard'
import { DashboardTodayActivityCard } from '@/components/dashboard/DashboardTodayActivityCard'
import { DashboardSystemAlertsCard } from '@/components/dashboard/DashboardSystemAlertsCard'
import { DashboardHandoverCard } from '@/components/dashboard/DashboardHandoverCard'
import { getGreeting, isStaffDashboard } from '@/components/dashboard/dashboardUtils'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import {
  Bell, CreditCard, Truck, Plus, ShoppingBag, HeadphonesIcon, AlertTriangle, Receipt, Package,
} from 'lucide-react'
import { type TimelineEvent } from '@/components/workflow/TimelineLog'
import { useFormatMoney } from '@/hooks/useSettings'
import { DraftsList } from '@/components/drafts/DraftsList'

export default function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { formatMoney } = useFormatMoney()

  useEffect(() => {
    if (user?.roles?.includes('client')) {
      navigate('/portal', { replace: true })
    }
  }, [user, navigate])

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
  const pendingDossiers = data?.pending_dossiers ?? []
  const todayActivity = data?.today_activity ?? null
  const systemAlerts = data?.system_alerts ?? []
  const handoverItems = data?.handover ?? []

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
      label: `${stats.pre_alerts ?? stats.pre_alerts_pending} colis en suivi`,
      href: '/shipment-notices',
      icon: Bell,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    })
  if ((stats.sav_open ?? 0) > 0)
    todayActions.push({
      label: `${stats.sav_open} ticket(s) SAV ouvert(s)`,
      href: '/sav',
      icon: HeadphonesIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    })
  if ((stats.sav_sla_at_risk ?? 0) > 0)
    todayActions.push({
      label: `${stats.sav_sla_at_risk} SLA en danger`,
      href: '/sav?sort=sla',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
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

  const isOperator = dashboardType === 'operator'

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
          subtitle="Suivez vos colis, vos devis et vos factures depuis votre espace personnel."
          gradient={['#0e7490', '#14B8A6'] as const}
          actions={[
            { label: 'Mes expéditions', href: '/portal/expeditions', icon: Truck },
            { label: 'Mes achats & devis', href: '/portal/achats', icon: ShoppingBag, variant: 'outline' },
            { label: 'Mes factures', href: '/portal/factures', icon: Receipt, variant: 'outline' },
            { label: 'Support (SAV)', href: '/portal/sav', icon: HeadphonesIcon, variant: 'outline' },
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
          actions={[
            { label: 'Voir mes pickups', href: '/pickups', icon: Truck },
            { label: 'Voir les expéditions', href: '/shipments', icon: Package, variant: 'outline' },
          ]}
        />
      )}

      {/* File d'actions urgentes */}
      {isStaffDashboard(dashboardType) && <DashboardTodayActionsCard actions={todayActions} />}

      {/* KPIs principaux */}
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

      {/* Dossiers en attente d'action (PRD 6.2) */}
      {isStaffDashboard(dashboardType) && (
        <DashboardPendingDossiersCard dossiers={pendingDossiers} />
      )}

      {/* Activité du jour — 4 colonnes (PRD 6.2) */}
      {isStaffDashboard(dashboardType) && todayActivity && (
        <DashboardTodayActivityCard activity={todayActivity} hideFinance={isOperator} />
      )}

      {isStaffDashboard(dashboardType) && <DashboardStaffQuickLinks />}

      {(isStaffDashboard(dashboardType) || dashboardType === 'client') && (
        <motion.div variants={fadeInUp}>
          <DraftsList />
        </motion.div>
      )}

      {/* Alertes système (PRD 6.2) */}
      {isStaffDashboard(dashboardType) && (
        <DashboardSystemAlertsCard alerts={systemAlerts} />
      )}

      {isStaffDashboard(dashboardType) && <DashboardRecentShipments shipments={recentShipments} />}

      {isStaffDashboard(dashboardType) && (
        <DashboardChartsSection
          monthlyEvolution={monthlyEvolution}
          statusDistribution={statusDistribution}
        />
      )}

      {/* Passation de service (PRD 6.2) */}
      {isStaffDashboard(dashboardType) && !isOperator && (
        <DashboardHandoverCard items={handoverItems} />
      )}

      {isStaffDashboard(dashboardType) && (
        <DashboardRecentActivityCard events={recentActivity} />
      )}
    </motion.div>
  )
}
