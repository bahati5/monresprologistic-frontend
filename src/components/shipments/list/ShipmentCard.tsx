import type { Dispatch, SetStateAction } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CorridorFlags } from '@/lib/countryFlags'
import { displayLocalized } from '@/lib/localizedString'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Eye, MoreHorizontal, FileText, Printer, Copy, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { downloadApiPdf } from '@/lib/openPdf'
import { getShipmentDetailHref } from '@/lib/shipmentPortalPaths'
import type { ShipmentDisplay } from '@/components/shipments/list/shipmentDisplay'
import { shipmentDisplay } from '@/components/shipments/list/shipmentDisplay'
import type { ShipmentTableRowModel } from '@/components/shipments/list/ShipmentListRow'

interface ShipmentCardProps {
  shipment: ShipmentTableRowModel
  canBulkRegroupe: boolean
  selectedIds: Set<number>
  setSelectedIds: Dispatch<SetStateAction<Set<number>>>
  formatMoney: (n: number, opts: { min: number; max: number }) => string
}

export function ShipmentCard({
  shipment: s,
  canBulkRegroupe,
  selectedIds,
  setSelectedIds,
  formatMoney,
}: ShipmentCardProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const detailHref = getShipmentDetailHref(pathname, s.id)
  const d: ShipmentDisplay = shipmentDisplay(s)
  return (
    <Card
      className="overflow-hidden transition-shadow hover:shadow-md cursor-pointer group"
      onClick={() => navigate(detailHref)}
    >
      <CardContent className="p-4">
        <div className="mb-3 flex items-start gap-3">
          {canBulkRegroupe ? (
            <div className="pt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                disabled={!d.eligibleRegroupe}
                title={!d.eligibleRegroupe ? 'Déjà dans un lot ou envoi maître' : 'Sélectionner'}
                checked={selectedIds.has(s.id)}
                onChange={() => {
                  setSelectedIds((prev) => {
                    const n = new Set(prev)
                    if (n.has(s.id)) n.delete(s.id)
                    else n.add(s.id)
                    return n
                  })
                }}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 rounded border-input bg-background"
              />
            </div>
          ) : null}
          <div className="min-w-0 flex-1 flex items-start justify-between gap-2">
            <span className="font-mono text-sm font-semibold tracking-tight break-all">
              {d.tracking || '—'}
            </span>
            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-70 group-hover:opacity-100">
                    <MoreHorizontal size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(detailHref)}>
                    <Eye size={14} className="mr-2" />Voir détail
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(String(d.tracking || '')); toast.success('Copie') }}>
                    <Copy size={14} className="mr-2" />Copier tracking
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      void downloadApiPdf(
                        `/api/shipments/${s.id}/pdf/invoice`,
                        `facture-${d.tracking || s.id}.pdf`,
                      )
                    }
                  >
                    <FileText size={14} className="mr-2" />Facture PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      void downloadApiPdf(
                        `/api/shipments/${s.id}/pdf/label`,
                        `etiquette-${d.tracking || s.id}.pdf`,
                      )
                    }
                  >
                    <Printer size={14} className="mr-2" />Étiquette PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Expéditeur</p>
            <p className="font-medium line-clamp-2">{displayLocalized(d.senderLabel)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Destinataire</p>
            <p className="line-clamp-2">{displayLocalized(d.recipientLabel)}</p>
            {d.recipientCity ? <p className="text-xs text-muted-foreground">{d.recipientCity}</p> : null}
          </div>
          {(s.corridor?.origin_iso2 || s.corridor?.dest_iso2 || s.route_display) ? (
            <div className="space-y-2 rounded-md border border-border/80 bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">Itinéraire</p>
              <div className="shrink-0">
                <CorridorFlags
                  originIso2={s.corridor?.origin_iso2}
                  destIso2={s.corridor?.dest_iso2}
                  originLabel={s.corridor?.origin_country}
                  destLabel={s.corridor?.dest_country}
                  displayWidth={24}
                />
              </div>
              {s.route_display ? (
                <p className="text-xs font-medium leading-relaxed text-foreground/90 break-words">
                  {s.route_display}
                </p>
              ) : null}
            </div>
          ) : null}
          {d.modeLabel ? (
            <Badge variant="outline" className="text-xs">
              <Truck size={10} className="mr-1" />
              {displayLocalized(d.modeLabel)}
            </Badge>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <Badge
              className="text-xs font-semibold"
              style={{ backgroundColor: d.stColor + '20', color: d.stColor, borderColor: d.stColor + '40' }}
            >
              {displayLocalized(s.status?.name)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(s.created_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <p className="text-right font-semibold tabular-nums pt-1 border-t border-border/60">
            {d.amount != null && d.amount !== ''
              ? formatMoney(Number(d.amount), { min: 0, max: 2 })
              : '—'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
