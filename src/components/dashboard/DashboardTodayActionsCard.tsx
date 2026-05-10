import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, type LucideIcon } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fadeInUp } from '@/lib/animations'

export interface DashboardTodayAction {
  label: string
  href: string
  icon: LucideIcon
  color: string
  bgColor: string
}

interface DashboardTodayActionsCardProps {
  actions: DashboardTodayAction[]
}

export function DashboardTodayActionsCard({ actions }: DashboardTodayActionsCardProps) {
  if (actions.length === 0) return null
  return (
    <motion.div variants={fadeInUp}>
      <Card className="border-amber-200 dark:border-amber-800/50 bg-gradient-to-r from-amber-50/60 to-transparent dark:from-amber-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-600" />
            Actions du jour
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {actions.map((action, i) => (
              <Link key={i} to={action.href}>
                <div className={`flex items-center gap-3 rounded-lg ${action.bgColor} p-3 transition-all hover:scale-[1.02] hover:shadow-sm`}>
                  <action.icon size={20} className={action.color} />
                  <span className="text-sm font-medium">{action.label}</span>
                  <ArrowRight size={14} className="ml-auto text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
