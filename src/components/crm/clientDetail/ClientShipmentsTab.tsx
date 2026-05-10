import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ArrowUpRight, ArrowDownLeft, ChevronRight } from 'lucide-react'
import {
  formatPublicTrackingDisplay,
  getShipmentCounterpartyLabel,
  normalizeShipmentStatusCode,
  shipmentStatusLabelFr,
} from '@/lib/shipmentDisplay'
import type { ClientShipmentRow } from '@/types/clientDetail'
import { formatDateTime } from './clientDetailFormatters'
import { StatusBadge } from './ClientDetailStatusBadge'

export interface ClientShipmentsTabProps {
  sentCount: number
  receivedCount: number
  sentShipments: { data: ClientShipmentRow[]; meta: { total: number } }
  receivedShipments: { data: ClientShipmentRow[]; meta: { total: number } }
}

export function ClientShipmentsTab({
  sentCount,
  receivedCount,
  sentShipments,
  receivedShipments,
}: ClientShipmentsTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-blue-600" /> Expéditions envoyées ({sentCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sentShipments?.data?.length ? (
            <div className="space-y-2">
              {sentShipments.data.map((s) => {
                const dt = formatDateTime(s.created_at)
                return (
                  <Link key={s.id} to={`/shipments/${s.id}`} className="block">
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="font-medium">{formatPublicTrackingDisplay(s.public_tracking, s.id)}</p>
                          <p className="text-xs text-muted-foreground">
                            Vers: {getShipmentCounterpartyLabel(s as unknown as Record<string, unknown>, 'recipient')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs font-medium">{dt.date}</p>
                          <p className="text-xs text-muted-foreground">{dt.time}</p>
                        </div>
                        {s.weight_kg > 0 && <span className="text-sm">{s.weight_kg} kg</span>}
                        <StatusBadge
                          status={s.status}
                          label={s.status_label ?? shipmentStatusLabelFr(normalizeShipmentStatusCode(s.status))}
                        />
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune expédition envoyée</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowDownLeft className="h-5 w-5 text-violet-600" /> Expéditions reçues ({receivedCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {receivedShipments?.data?.length ? (
            <div className="space-y-2">
              {receivedShipments.data.map((s) => {
                const dt = formatDateTime(s.created_at)
                return (
                  <Link key={s.id} to={`/shipments/${s.id}`} className="block">
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-violet-500" />
                        <div>
                          <p className="font-medium">{formatPublicTrackingDisplay(s.public_tracking, s.id)}</p>
                          <p className="text-xs text-muted-foreground">
                            De: {getShipmentCounterpartyLabel(s as unknown as Record<string, unknown>, 'sender')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs font-medium">{dt.date}</p>
                          <p className="text-xs text-muted-foreground">{dt.time}</p>
                        </div>
                        {s.weight_kg > 0 && <span className="text-sm">{s.weight_kg} kg</span>}
                        <StatusBadge
                          status={s.status}
                          label={s.status_label ?? shipmentStatusLabelFr(normalizeShipmentStatusCode(s.status))}
                        />
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune expédition reçue</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
