import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { History, ArrowUpRight, ArrowDownLeft, User, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  formatPublicTrackingDisplay,
  normalizeShipmentStatusCode,
  shipmentStatusLabelFr,
} from '@/lib/shipmentDisplay'
import type { ClientTimelineEvent } from '@/types/clientDetail'
import { formatDateTime } from './clientDetailFormatters'
import { StatusBadge } from './ClientDetailStatusBadge'

export interface ClientDetailTimelineTabProps {
  timeline: ClientTimelineEvent[]
}

export function ClientDetailTimelineTab({ timeline }: ClientDetailTimelineTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" /> Historique des actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {timeline && timeline.length > 0 ? (
          <div className="relative">
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />
            <div className="space-y-0">
              {timeline.map((event, idx) => {
                const dt = formatDateTime(event.created_at)
                const isLast = idx === timeline.length - 1
                return (
                  <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                    <div className={cn(
                      'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-background',
                      event.role === 'sender' ? 'bg-blue-100' : 'bg-violet-100'
                    )}>
                      {event.role === 'sender'
                        ? <ArrowUpRight className="h-4 w-4 text-blue-600" />
                        : <ArrowDownLeft className="h-4 w-4 text-violet-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div>
                          <p className="text-sm font-medium">{event.title}</p>
                          {event.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                          )}
                        </div>
                        <StatusBadge
                          status={event.status}
                          label={shipmentStatusLabelFr(normalizeShipmentStatusCode(event.status))}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                        <Link to={`/shipments/${event.shipment_id}`} className="font-mono hover:text-primary hover:underline">
                          {formatPublicTrackingDisplay(event.tracking, event.shipment_id)}
                        </Link>
                        <span className={cn(
                          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium',
                          event.role === 'sender' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'
                        )}>
                          {event.role === 'sender' ? 'Expéditeur' : 'Destinataire'}
                        </span>
                        {event.user_name && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" /> {event.user_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {dt.date} à {dt.time}
                        </span>
                      </div>
                      {!isLast && <Separator className="mt-4" />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <History className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucun historique disponible</p>
            <p className="text-xs text-muted-foreground mt-1">Les actions liées aux expéditions apparaîtront ici</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
