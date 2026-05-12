import { Link } from 'react-router-dom'
import { CorridorFlags } from '@/lib/countryFlags'
import { displayLocalized } from '@/lib/localizedString'
import { STATUS_COLORS } from '@/lib/animations'
import { Badge } from '@/components/ui/badge'
import { Package } from 'lucide-react'
import type { RegroupementLotShipmentRow } from '@/hooks/useOperations'

interface RegroupementNestedShipmentsTableProps {
  shipments: RegroupementLotShipmentRow[] | undefined
}

export function RegroupementNestedShipmentsTable({ shipments }: RegroupementNestedShipmentsTableProps) {
  return (
    <div className="max-w-full min-w-0 overflow-x-hidden rounded-md border bg-background">
      <table className="w-full min-w-0 table-fixed text-xs">
        <thead>
          <tr className="border-b bg-muted/50 text-left text-muted-foreground">
            <th className="px-3 py-2 font-medium">Colis</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">Départ → arrivée</th>
            <th className="px-3 py-2 font-medium">Statut</th>
            <th className="px-3 py-2 font-medium text-right">Poids</th>
          </tr>
        </thead>
        <tbody>
          {(shipments ?? []).map((row) => {
            const st = row.status?.code || ''
            const stColor = row.status?.color_hex || STATUS_COLORS[st] || '#64748B'
            return (
              <tr key={row.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-3 py-2 align-top">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
                      <Package className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/shipments/${row.id}`}
                        className="block font-mono text-[11px] font-medium text-primary hover:underline break-all"
                      >
                        {row.public_tracking || `#${row.id}`}
                      </Link>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                        {row.recipient_name || '—'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 align-top">
                  <div className="flex max-w-[min(100%,12rem)] flex-col gap-1.5">
                    <div className="shrink-0">
                      <CorridorFlags
                        originIso2={row.corridor?.origin_iso2}
                        destIso2={row.corridor?.dest_iso2}
                      />
                    </div>
                    <span className="text-muted-foreground leading-snug break-words">{row.route_display || '—'}</span>
                  </div>
                </td>
                <td className="px-3 py-2 align-top">
                  {row.status ? (
                    <Badge
                      className="text-[10px] font-semibold"
                      style={{
                        backgroundColor: `${stColor}20`,
                        color: stColor,
                        borderColor: `${stColor}40`,
                      }}
                    >
                      {displayLocalized(row.status.name)}
                    </Badge>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-2 align-top text-right tabular-nums">
                  {row.weight_kg != null ? `${Number(row.weight_kg).toFixed(1)} kg` : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
