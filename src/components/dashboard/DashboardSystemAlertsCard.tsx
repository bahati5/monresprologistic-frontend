import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { AlertTriangle, Info, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fadeInUp } from '@/lib/animations'

interface SystemAlert {
  level: 'warning' | 'info'
  message: string
  href?: string
}

interface Props {
  alerts: SystemAlert[]
}

export function DashboardSystemAlertsCard({ alerts }: Props) {
  if (!alerts || alerts.length === 0) return null

  return (
    <motion.div variants={fadeInUp}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-lg">&#128276;</span>
            Alertes système
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-lg p-3 text-sm ${
                alert.level === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900'
                  : 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900'
              }`}
            >
              {alert.level === 'warning' ? (
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              ) : (
                <Info className="h-4 w-4 text-blue-600 shrink-0" />
              )}
              <span className="flex-1">{alert.message}</span>
              {alert.href && (
                <Link to={alert.href} className="text-primary hover:underline shrink-0 flex items-center gap-1 text-xs font-medium">
                  Voir <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
}
