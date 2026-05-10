import { motion } from 'framer-motion'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TimelineLog, type TimelineEvent } from '@/components/workflow/TimelineLog'
import { fadeInUp } from '@/lib/animations'

interface DashboardRecentActivityCardProps {
  events: TimelineEvent[]
}

export function DashboardRecentActivityCard({ events }: DashboardRecentActivityCardProps) {
  return (
    <motion.div variants={fadeInUp}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Activite recente</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <TimelineLog events={events} maxItems={5} />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun historique de statut pour le moment.
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
