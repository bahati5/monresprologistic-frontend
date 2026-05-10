import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Truck } from 'lucide-react'
import {
  normalizeShipmentStatusCode,
  shipmentStatusLabelFr,
} from '@/lib/shipmentDisplay'
import type { ClientShipmentNoticeRow } from '@/types/clientDetail'
import { formatDateTime } from './clientDetailFormatters'
import { StatusBadge } from './ClientDetailStatusBadge'

export interface ClientDetailNoticesTabProps {
  shipmentNotices: { data: ClientShipmentNoticeRow[]; meta: { total: number } }
}

export function ClientDetailNoticesTab({ shipmentNotices }: ClientDetailNoticesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Truck className="h-5 w-5" /> Avis d'expédition (Pré-alerts)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {shipmentNotices?.data?.length ? (
          <div className="space-y-2">
            {shipmentNotices.data.map((n) => {
              const dt = formatDateTime(n.created_at)
              return (
                <div key={n.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Truck className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="font-medium">{n.reference_code}</p>
                      <p className="text-xs text-muted-foreground">
                        {n.carrier_name} — {n.tracking_number}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-medium">{dt.date}</p>
                      <p className="text-xs text-muted-foreground">{dt.time}</p>
                    </div>
                    <StatusBadge
                      status={n.status}
                      label={n.status_label ?? shipmentStatusLabelFr(normalizeShipmentStatusCode(n.status))}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Aucun avis d'expédition</p>
        )}
      </CardContent>
    </Card>
  )
}
