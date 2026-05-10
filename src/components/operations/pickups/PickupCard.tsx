import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { displayLocalized } from '@/lib/localizedString'
import { STATUS_COLORS } from '@/lib/animations'
import { MoreHorizontal, UserPlus, RefreshCw, MapPin, Calendar, Truck, Camera, Navigation } from 'lucide-react'
import { PICKUP_STATUS_LABELS } from '@/components/operations/pickups/pickupStatus'

export type PickupRowModel = {
  id: number
  address?: string | null
  latitude?: number
  longitude?: number
  scheduled_at?: string | null
  has_completion_photo?: boolean
  status?: string | { code?: string }
  client?: { name?: string | null }
  user?: { name?: string | null }
  driver?: { name?: string | null }
}

interface PickupCardProps {
  pickup: PickupRowModel
  isDriver: boolean
  onAssignDriver: () => void
  onChangeStatus: () => void
  onUploadPhoto: () => void
  mapsUrl: (address: string, lat?: number, lng?: number) => string
}

export function PickupCard({
  pickup: p,
  isDriver,
  onAssignDriver,
  onChangeStatus,
  onUploadPhoto,
  mapsUrl,
}: PickupCardProps) {
  const stCode = typeof p.status === 'string' ? p.status : p.status?.code || ''
  const stColor = STATUS_COLORS[stCode] || '#64748B'
  const stLabel = PICKUP_STATUS_LABELS[stCode] || stCode || '—'
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-xs text-muted-foreground">#{p.id}</p>
            <p className="font-medium">{displayLocalized(p.client?.name || p.user?.name)}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreHorizontal size={14} /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isDriver ? (
                <DropdownMenuItem onClick={onAssignDriver}>
                  <UserPlus size={14} className="mr-2" />Assigner chauffeur
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={onChangeStatus}>
                <RefreshCw size={14} className="mr-2" />Changer statut
              </DropdownMenuItem>
              {isDriver && !p.has_completion_photo ? (
                <DropdownMenuItem onClick={onUploadPhoto}>
                  <Camera size={14} className="mr-2" />Photo preuve
                </DropdownMenuItem>
              ) : null}
              {p.address ? (
                <DropdownMenuItem asChild>
                  <a href={mapsUrl(p.address, p.latitude, p.longitude)} target="_blank" rel="noreferrer">
                    <Navigation size={14} className="mr-2" />Ouvrir dans Maps
                  </a>
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-start gap-1 text-sm text-muted-foreground">
          <MapPin size={14} className="shrink-0 mt-0.5" />
          <span>{p.address || '-'}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {p.driver ? (
            <Badge variant="outline" className="text-xs"><Truck size={10} className="mr-1" />{displayLocalized(p.driver.name)}</Badge>
          ) : <span className="text-xs text-muted-foreground">Chauffeur non assigné</span>}
          <Badge className="text-xs" style={{ backgroundColor: stColor + '20', color: stColor, borderColor: stColor + '40' }}>{stLabel}</Badge>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar size={12} />
          {p.scheduled_at ? new Date(p.scheduled_at).toLocaleDateString('fr-FR') : '—'}
        </div>
      </CardContent>
    </Card>
  )
}
