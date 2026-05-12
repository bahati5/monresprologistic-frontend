import { motion } from 'framer-motion'
import {
  Bell, CheckCircle, CreditCard, Coins, FileText, Package, Truck, Users,
} from 'lucide-react'

import { KpiCard } from '@/components/dashboard/KpiCard'
import { isStaffDashboard } from '@/components/dashboard/dashboardUtils'
import { fadeInUp } from '@/lib/animations'

interface DashboardKpiSectionProps {
  dashboardType: string
  stats: Record<string, unknown>
  clientExtras?: { preAlertsCount?: number }
  formatMoney: (value: number) => string
}

export function DashboardKpiSection({
  dashboardType,
  stats,
  clientExtras,
  formatMoney,
}: DashboardKpiSectionProps) {
  if (isStaffDashboard(dashboardType)) {
    return (
      <motion.div variants={fadeInUp} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          title="Expeditions totales"
          value={Number(stats.shipments_total ?? 0)}
          icon={Package}
          color="#3B82F6"
          trend={stats.shipments_trend != null ? Number(stats.shipments_trend) : undefined}
          trendLabel="vs mois dernier"
          href="/shipments"
          delay={0}
        />
        <KpiCard
          title="Pickups aujourd'hui"
          value={Number(stats.pickups_count ?? stats.pickups_today ?? 0)}
          icon={Truck}
          color="#10B981"
          href="/pickups"
          delay={1}
        />
        <KpiCard
          title="Colis en suivi"
          value={Number(stats.pre_alerts ?? stats.pre_alerts_pending ?? 0)}
          icon={Bell}
          color="#F59E0B"
          href="/shipment-notices"
          delay={2}
        />
        <KpiCard
          title="Paiements a valider"
          value={Number(stats.payment_proofs_pending ?? 0)}
          icon={CreditCard}
          color="#EF4444"
          href="/finance/payment-proofs"
          delay={3}
        />
        <KpiCard
          title="Revenus du mois"
          value={formatMoney(Number(stats.monthly_revenue ?? 0))}
          icon={Coins}
          color="#14B8A6"
          trend={stats.revenue_trend != null ? Number(stats.revenue_trend) : undefined}
          trendLabel="vs mois dernier"
          href="/finance/dashboard"
          delay={4}
          animateValue={false}
        />
        <KpiCard
          title="Clients actifs"
          value={Number(stats.clients_count ?? 0)}
          icon={Users}
          color="#8B5CF6"
          href="/clients"
          delay={5}
        />
      </motion.div>
    )
  }

  if (dashboardType === 'client') {
    return (
      <motion.div variants={fadeInUp} className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard title="Colis en suivi" value={Number(stats.pre_alerts ?? clientExtras?.preAlertsCount ?? 0)} icon={Bell} color="#F59E0B" href="/shipment-notices" delay={0} />
        <KpiCard title="Shopping Assiste" value={Number(stats.purchase_orders ?? 0)} icon={FileText} color="#6366F1" href="/purchase-orders" delay={1} />
        <KpiCard title="Mes expeditions" value={Number(stats.shipments_total ?? 0)} icon={Package} color="#3B82F6" href="/shipments" delay={2} />
      </motion.div>
    )
  }

  if (dashboardType === 'driver') {
    return (
      <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <KpiCard title="Pickups en attente" value={Number(stats.pickups_pending ?? 0)} icon={Truck} color="#F59E0B" href="/pickups" delay={0} />
        <KpiCard title="Livraisons en cours" value={Number(stats.deliveries_pending ?? 0)} icon={Package} color="#3B82F6" href="/shipments" delay={1} />
        <KpiCard title="Completees aujourd'hui" value={Number(stats.completed_today ?? 0)} icon={CheckCircle} color="#10B981" delay={2} />
      </motion.div>
    )
  }

  return null
}
