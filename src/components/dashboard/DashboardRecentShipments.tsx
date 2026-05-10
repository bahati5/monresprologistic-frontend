import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fadeInUp } from '@/lib/animations'

export interface RecentShipmentRow {
  id: number
  tracking_number?: string
  status?: string
  created_at?: string
  sender_profile?: { full_name?: string; first_name?: string }
  recipient_profile?: { full_name?: string; first_name?: string }
}

interface DashboardRecentShipmentsProps {
  shipments: RecentShipmentRow[]
}

export function DashboardRecentShipments({ shipments }: DashboardRecentShipmentsProps) {
  if (shipments.length === 0) return null
  return (
    <motion.div variants={fadeInUp}>
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock size={16} /> Expeditions recentes
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Les 10 dernieres expeditions</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/shipments">Tout voir <ArrowRight size={14} className="ml-1" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-2 font-medium">Tracking</th>
                  <th className="text-left px-4 py-2 font-medium">Expediteur</th>
                  <th className="text-left px-4 py-2 font-medium">Destinataire</th>
                  <th className="text-center px-4 py-2 font-medium">Statut</th>
                  <th className="text-left px-4 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {shipments.slice(0, 8).map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2">
                      <Link to={`/shipments/${s.id}`} className="font-mono text-xs text-primary hover:underline font-semibold">
                        {s.tracking_number || `EXP-${s.id}`}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-xs truncate max-w-[140px]">
                      {s.sender_profile?.full_name || s.sender_profile?.first_name || '\u2014'}
                    </td>
                    <td className="px-4 py-2 text-xs truncate max-w-[140px]">
                      {s.recipient_profile?.full_name || s.recipient_profile?.first_name || '\u2014'}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Badge variant="outline" className="text-[10px] font-normal">
                        {typeof s.status === 'string' ? s.status.replace(/_/g, ' ') : '\u2014'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : '\u2014'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
