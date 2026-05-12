import { motion } from 'framer-motion'
import { Package, ShoppingBag, HeadphonesIcon, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fadeInUp } from '@/lib/animations'
import { useFormatMoney } from '@/hooks/useSettings'

interface ActivitySection {
  created_today?: number
  in_transit?: number
  arrived?: number
  delivered?: number
  received_today?: number
  quotes_sent?: number
  accepted_today?: number
  pending_payment?: number
  open?: number
  resolved_today?: number
  sla_rate?: number
  escalated?: number
  revenue_today?: number
  payments_received?: number
  refunds?: number
  pending_validation?: number
}

interface TodayActivity {
  expeditions?: ActivitySection
  achat_assiste?: ActivitySection
  sav?: ActivitySection
  finance?: ActivitySection
}

interface Props {
  activity: TodayActivity
  hideFinance?: boolean
}

export function DashboardTodayActivityCard({ activity, hideFinance }: Props) {
  const { formatMoney } = useFormatMoney()
  if (!activity) return null

  const exp = activity.expeditions ?? {}
  const aa = activity.achat_assiste ?? {}
  const sav = activity.sav ?? {}
  const fin = activity.finance ?? {}

  const sections = [
    {
      title: 'Expéditions',
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      lines: [
        { label: 'Créées aujourd\'hui', value: exp.created_today ?? 0 },
        { label: 'En transit', value: exp.in_transit ?? 0 },
        { label: 'Arrivées', value: exp.arrived ?? 0 },
        { label: 'Livrées', value: exp.delivered ?? 0 },
      ],
    },
    {
      title: 'Achat assisté',
      icon: ShoppingBag,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-950/30',
      lines: [
        { label: 'Demandes reçues', value: aa.received_today ?? 0 },
        { label: 'Devis envoyés', value: aa.quotes_sent ?? 0 },
        { label: 'Acceptés auj.', value: aa.accepted_today ?? 0 },
        { label: 'En attente paiement', value: aa.pending_payment ?? 0 },
      ],
    },
    {
      title: 'SAV',
      icon: HeadphonesIcon,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      lines: [
        { label: 'Tickets ouverts', value: sav.open ?? 0 },
        { label: 'Résolus auj.', value: sav.resolved_today ?? 0 },
        { label: 'SLA respectés', value: `${sav.sla_rate ?? 0}%` },
        { label: 'Escaladés', value: sav.escalated ?? 0 },
      ],
    },
    ...(!hideFinance
      ? [
          {
            title: 'Finance',
            icon: DollarSign,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
            lines: [
              { label: 'CA aujourd\'hui', value: formatMoney(fin.revenue_today ?? 0) },
              { label: 'Paiements reçus', value: fin.payments_received ?? 0 },
              { label: 'Remboursements', value: fin.refunds ?? 0 },
              { label: 'En attente valid.', value: fin.pending_validation ?? 0 },
            ],
          },
        ]
      : []),
  ]

  return (
    <motion.div variants={fadeInUp}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-lg">&#128202;</span>
            Activité du jour
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${hideFinance ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`}>
            {sections.map((s) => (
              <div key={s.title} className={`rounded-xl ${s.bg} p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                  <span className="text-sm font-semibold">{s.title}</span>
                </div>
                <div className="space-y-2">
                  {s.lines.map((line) => (
                    <div key={line.label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{line.label}</span>
                      <span className="font-semibold tabular-nums">{line.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
