import { motion } from 'framer-motion'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fadeInUp } from '@/lib/animations'

interface DashboardOperatorCardProps {
  packagesToday: number
}

export function DashboardOperatorCard({ packagesToday }: DashboardOperatorCardProps) {
  return (
    <motion.div variants={fadeInUp}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Flux operateur</CardTitle>
          <p className="text-xs text-muted-foreground">Colis recus aujourd&apos;hui (agence)</p>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">{packagesToday}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
