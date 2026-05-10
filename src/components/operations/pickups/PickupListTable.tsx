import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { displayLocalized } from '@/lib/localizedString'
import { STATUS_COLORS } from '@/lib/animations'
import { MoreHorizontal, UserPlus, RefreshCw, MapPin, Truck, Camera, Navigation, Package } from 'lucide-react'
import { PICKUP_STATUS_LABELS } from '@/components/operations/pickups/pickupStatus'
import type { PickupRowModel } from '@/components/operations/pickups/PickupCard'

interface PickupListTableProps {
  isLoading: boolean
  pickups: PickupRowModel[]
  isDriver: boolean
  mapsUrl: (address: string, lat?: number, lng?: number) => string
  onAssignDriver: (id: number) => void
  onChangeStatus: (id: number, currentStatus: string) => void
  onUploadPhoto: (id: number) => void
}

export function PickupListTable({
  isLoading,
  pickups,
  isDriver,
  mapsUrl,
  onAssignDriver,
  onChangeStatus,
  onUploadPhoto,
}: PickupListTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">Client</th>
                <th className="px-4 py-3 text-left font-medium">Adresse</th>
                <th className="px-4 py-3 text-left font-medium">Chauffeur</th>
                <th className="px-4 py-3 text-left font-medium">Statut</th>
                <th className="px-4 py-3 text-left font-medium">Date prevue</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b">{[...Array(7)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-muted" /></td>
                  ))}</tr>
                ))
              ) : pickups.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center">
                  <Package size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground">
                    {isDriver
                      ? 'Aucune mission assignée pour le moment.'
                      : 'Aucun ramassage'}
                  </p>
                </td></tr>
              ) : (
                pickups.map((p) => {
                  const stCode = typeof p.status === 'string' ? p.status : p.status?.code || ''
                  const stColor = STATUS_COLORS[stCode] || '#64748B'
                  const stLabel = PICKUP_STATUS_LABELS[stCode] || stCode || '—'
                  return (
                    <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">#{p.id}</td>
                      <td className="px-4 py-3 font-medium">{displayLocalized(p.client?.name || p.user?.name)}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1"><MapPin size={12} className="text-muted-foreground" />{p.address || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                        {p.driver ? (
                          <Badge variant="outline" className="text-xs"><Truck size={10} className="mr-1" />{displayLocalized(p.driver.name)}</Badge>
                        ) : <span className="text-xs text-muted-foreground">Non assigne</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="text-xs" style={{ backgroundColor: stColor + '20', color: stColor, borderColor: stColor + '40' }}>
                          {stLabel}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {p.scheduled_at ? new Date(p.scheduled_at).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={14} /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!isDriver ? (
                              <DropdownMenuItem onClick={() => onAssignDriver(p.id)}>
                                <UserPlus size={14} className="mr-2" />Assigner chauffeur
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem onClick={() => onChangeStatus(p.id, stCode)}>
                              <RefreshCw size={14} className="mr-2" />Changer statut
                            </DropdownMenuItem>
                            {isDriver && !p.has_completion_photo ? (
                              <DropdownMenuItem onClick={() => onUploadPhoto(p.id)}>
                                <Camera size={14} className="mr-2" />Uploader photo preuve
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
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
