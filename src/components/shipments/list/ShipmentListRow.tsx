import type { Dispatch, SetStateAction } from 'react'
import { useNavigate } from 'react-router-dom'
import { CorridorFlags } from '@/lib/countryFlags'
import { displayLocalized } from '@/lib/localizedString'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Eye, MoreHorizontal, FileText, Printer, Copy, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { downloadApiPdf } from '@/lib/openPdf'
import type { ShipmentDisplay } from '@/components/shipments/list/shipmentDisplay'
import { shipmentDisplay } from '@/components/shipments/list/shipmentDisplay'

export type ShipmentTableRowModel = Parameters<typeof shipmentDisplay>[0] & {
  id: number
  corridor?: {
    origin_iso2?: string | null
    dest_iso2?: string | null
    origin_country?: string | null
    dest_country?: string | null
  }
  route_display?: string | null
  created_at: string
}

interface ShipmentListRowProps {
  shipment: ShipmentTableRowModel
  canBulkRegroupe: boolean
  selectedIds: Set<number>
  setSelectedIds: Dispatch<SetStateAction<Set<number>>>
  formatMoney: (n: number, opts: { min: number; max: number }) => string
}

export function ShipmentListRow({
  shipment: s,
  canBulkRegroupe,
  selectedIds,
  setSelectedIds,
  formatMoney,
}: ShipmentListRowProps) {
  const navigate = useNavigate()
  const d: ShipmentDisplay = shipmentDisplay(s)
  return (
    <tr className="border-b hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => navigate(`/shipments/${s.id}`)}>
      {canBulkRegroupe ? (
        <td
          className="w-14 min-w-[3.5rem] px-3 py-3 align-middle text-center"
          onClick={(e) => e.stopPropagation()}
        >
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
            className="h-4 w-4 rounded border-input align-middle"
          />
        </td>
      ) : null}
      <td className="px-4 py-3">
        <span className="block font-mono text-xs font-medium break-all">{d.tracking || '—'}</span>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-sm">{displayLocalized(d.senderLabel)}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm">{displayLocalized(d.recipientLabel)}</p>
        {d.recipientCity ? <p className="text-xs text-muted-foreground">{d.recipientCity}</p> : null}
      </td>
      <td className="px-4 py-3 align-top">
        <div className="flex max-w-[min(100%,14rem)] flex-col gap-1.5">
          <div className="shrink-0">
            <CorridorFlags
              originIso2={s.corridor?.origin_iso2}
              destIso2={s.corridor?.dest_iso2}
              originLabel={s.corridor?.origin_country}
              destLabel={s.corridor?.dest_country}
            />
          </div>
          {s.route_display ? (
            <span className="text-xs leading-snug text-muted-foreground break-words">{s.route_display}</span>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3">
        {d.modeLabel ? (
          <Badge variant="outline" className="text-xs"><Truck size={10} className="mr-1" />{displayLocalized(d.modeLabel)}</Badge>
        ) : '—'}
      </td>
      <td className="px-4 py-3">
        <Badge
          className="text-xs font-semibold"
          style={{ backgroundColor: d.stColor + '20', color: d.stColor, borderColor: d.stColor + '40' }}
        >
          {displayLocalized(s.status?.name)}
        </Badge>
      </td>
      <td className="px-4 py-3 text-right font-medium tabular-nums">
        {d.amount != null && d.amount !== ''
          ? formatMoney(Number(d.amount), { min: 0, max: 2 })
          : '—'}
      </td>
      <td className="px-4 py-3 text-muted-foreground text-xs">
        {new Date(s.created_at).toLocaleDateString('fr-FR')}
      </td>
      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={14} /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/shipments/${s.id}`)}>
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
              <FileText size={14} className="mr-2" />Télécharger facture (PDF)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                void downloadApiPdf(
                  `/api/shipments/${s.id}/pdf/label`,
                  `etiquette-${d.tracking || s.id}.pdf`,
                )
              }
            >
              <Printer size={14} className="mr-2" />Télécharger étiquette (PDF)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}
