import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  User, Mail, Phone, MapPin, Building2, Clock, ChevronRight,
  ArrowUpRight, ArrowDownLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CountryNameWithFlag } from '@/components/CountryNameWithFlag'
import {
  formatPublicTrackingDisplay,
  getShipmentCounterpartyLabel,
  normalizeShipmentStatusCode,
  shipmentStatusLabelFr,
} from '@/lib/shipmentDisplay'
import type { ClientProfile, ClientShipmentRow, ClientTimelineEvent } from '@/types/clientDetail'
import { formatDateTime } from './clientDetailFormatters'
import { StatusBadge } from './ClientDetailStatusBadge'

export interface ClientDetailOverviewTabProps {
  client: ClientProfile
  timeline: ClientTimelineEvent[]
  sentShipments: { data: ClientShipmentRow[]; meta: { total: number } }
  receivedShipments: { data: ClientShipmentRow[]; meta: { total: number } }
  onViewAllActivity: () => void
}

export function ClientDetailOverviewTab({
  client,
  timeline,
  sentShipments,
  receivedShipments,
  onViewAllActivity,
}: ClientDetailOverviewTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" /> Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{client.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{client.phone}</span>
              {client.phone_secondary && <span className="text-muted-foreground">/ {client.phone_secondary}</span>}
            </div>
            {(client.address || client.city || client.country) && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  {client.address && <p>{client.address}</p>}
                  <p className="text-muted-foreground">
                    {[client.city?.name, client.state?.name].filter(Boolean).join(', ')}
                  </p>
                  {client.country && (
                    <p className="flex items-center gap-2 mt-0.5">
                      <CountryNameWithFlag country={client.country} flagSize="sm" />
                    </p>
                  )}
                </div>
              </div>
            )}
            {client.landmark && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{client.landmark}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" /> Activité récente
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onViewAllActivity}>
              Voir tout <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {timeline && timeline.length > 0 ? (
              <div className="space-y-1">
                {timeline.slice(0, 8).map((event) => {
                  const dt = formatDateTime(event.created_at)
                  return (
                    <Link key={event.id} to={`/shipments/${event.shipment_id}`} className="block">
                      <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className={cn(
                          'mt-0.5 p-1.5 rounded-full shrink-0',
                          event.role === 'sender' ? 'bg-blue-100' : 'bg-violet-100'
                        )}>
                          {event.role === 'sender'
                            ? <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" />
                            : <ArrowDownLeft className="h-3.5 w-3.5 text-violet-600" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{event.title}</span>
                            <StatusBadge
                              status={event.status}
                              label={shipmentStatusLabelFr(normalizeShipmentStatusCode(event.status))}
                            />
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span className="font-mono">{formatPublicTrackingDisplay(event.tracking, event.shipment_id)}</span>
                            <span>{event.role === 'sender' ? 'Expéditeur' : 'Destinataire'}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">{dt.relative}</p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-1">
                {sentShipments?.data?.slice(0, 3).map((s) => {
                  const dt = formatDateTime(s.created_at)
                  return (
                    <Link key={`sent-${s.id}`} to={`/shipments/${s.id}`} className="block">
                      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-100 rounded-full">
                            <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <div>
                            <span className="text-sm font-medium">
                              {formatPublicTrackingDisplay(s.public_tracking, s.id)}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              Envoi vers {getShipmentCounterpartyLabel(s as unknown as Record<string, unknown>, 'recipient')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{dt.relative}</span>
                          <StatusBadge
                            status={s.status}
                            label={s.status_label ?? shipmentStatusLabelFr(normalizeShipmentStatusCode(s.status))}
                          />
                        </div>
                      </div>
                    </Link>
                  )
                })}
                {receivedShipments?.data?.slice(0, 3).map((s) => {
                  const dt = formatDateTime(s.created_at)
                  return (
                    <Link key={`recv-${s.id}`} to={`/shipments/${s.id}`} className="block">
                      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-violet-100 rounded-full">
                            <ArrowDownLeft className="h-3.5 w-3.5 text-violet-600" />
                          </div>
                          <div>
                            <span className="text-sm font-medium">
                              {formatPublicTrackingDisplay(s.public_tracking, s.id)}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              Reçu de {getShipmentCounterpartyLabel(s as unknown as Record<string, unknown>, 'sender')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{dt.relative}</span>
                          <StatusBadge
                            status={s.status}
                            label={s.status_label ?? shipmentStatusLabelFr(normalizeShipmentStatusCode(s.status))}
                          />
                        </div>
                      </div>
                    </Link>
                  )
                })}
                {!sentShipments?.data?.length && !receivedShipments?.data?.length && (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucune activité récente</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
