import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Layers, Package } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CorridorFlags, LotRouteFlags } from '@/lib/countryFlags'
import { fadeInUp, STATUS_COLORS } from '@/lib/animations'
import { displayLocalized } from '@/lib/localizedString'

type ShipmentsInLotRow = {
  id: number
  public_tracking?: string | null
  recipient_name?: string | null
  route_display?: string | null
  corridor?: {
    origin_iso2?: string | null
    dest_iso2?: string | null
    origin_country?: string | null
    dest_country?: string | null
  }
  status?: { code?: string; name?: unknown; color_hex?: string | null }
  weight_kg?: number | null
}

export interface ShipmentRegroupementSummary {
  batch_number: string
  same_lot_count?: number | null
  status?: { code?: string; name?: unknown; color_hex?: string | null }
  lot_route?: {
    origin_iso2s: string[]
    dest_iso2s: string[]
    label?: string | null
  } | null
  shipments_in_lot?: ShipmentsInLotRow[]
}

export interface ShipmentDetailRegroupementCardProps {
  shipmentId: string | undefined
  regroupement: ShipmentRegroupementSummary
}

export function ShipmentDetailRegroupementCard({ shipmentId, regroupement }: ShipmentDetailRegroupementCardProps) {
  const rows = regroupement.shipments_in_lot

  return (
    <motion.div variants={fadeInUp}>
      <Card className="overflow-hidden border-primary/25 bg-primary/[0.04] shadow-sm">
        <CardHeader className="pb-3 space-y-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                Cette expédition fait partie d&apos;un lot (regroupement)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Numéro de lot{' '}
                <span className="font-mono font-semibold text-foreground">{regroupement.batch_number}</span>
                {typeof regroupement.same_lot_count === 'number'
                  ? ` · ${regroupement.same_lot_count} colis dans ce lot`
                  : null}
              </p>
              {regroupement.lot_route ? (
                <div className="space-y-1.5 pt-1 text-sm">
                  <p className="text-muted-foreground">Corridor agrégé du lot</p>
                  <div className="shrink-0">
                    <LotRouteFlags
                      originIso2s={regroupement.lot_route.origin_iso2s}
                      destIso2s={regroupement.lot_route.dest_iso2s}
                      label={regroupement.lot_route.label ?? undefined}
                    />
                  </div>
                  {regroupement.lot_route.label ? (
                    <p className="text-xs leading-relaxed text-muted-foreground break-words">
                      {regroupement.lot_route.label}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:items-end shrink-0">
              {regroupement.status ? (
                <Badge
                  className="text-xs w-fit"
                  style={{
                    backgroundColor: `${regroupement.status.color_hex || STATUS_COLORS[regroupement.status.code || ''] || '#64748B'}20`,
                    color:
                      regroupement.status.color_hex || STATUS_COLORS[regroupement.status.code || ''] || '#64748B',
                    borderColor: `${regroupement.status.color_hex || STATUS_COLORS[regroupement.status.code || ''] || '#64748B'}40`,
                  }}
                >
                  Lot : {displayLocalized(regroupement.status.name)}
                </Badge>
              ) : null}
              <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                <Link to="/regroupements">Voir tous les regroupements</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        {Array.isArray(rows) && rows.length > 0 ? (
          <CardContent className="pt-0">
            <p className="text-xs font-medium text-muted-foreground mb-2">Colis rattachés à ce même lot</p>
            <div className="hidden min-w-0 md:block overflow-x-auto rounded-lg border bg-background">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/45 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Colis</th>
                    <th className="px-3 py-2 font-medium whitespace-nowrap">Départ → arrivée</th>
                    <th className="px-3 py-2 font-medium">Statut</th>
                    <th className="px-3 py-2 font-medium text-right">Poids</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const st = row.status?.code || ''
                    const stColor = row.status?.color_hex || STATUS_COLORS[st] || '#64748B'
                    const isCurrent = row.id === Number(shipmentId)
                    return (
                      <tr
                        key={row.id}
                        className={`border-b last:border-0 ${isCurrent ? 'bg-primary/10' : 'hover:bg-muted/25'}`}
                      >
                        <td className="px-3 py-2 align-top">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                              <Package className="h-4 w-4 text-muted-foreground" aria-hidden />
                            </div>
                            <div className="min-w-0 flex-1">
                              <Link
                                to={`/shipments/${row.id}`}
                                className="block font-mono text-xs font-medium text-primary hover:underline break-all"
                              >
                                {row.public_tracking || `#${row.id}`}
                              </Link>
                              {isCurrent ? (
                                <Badge variant="secondary" className="text-[10px] mt-1 block w-fit">
                                  Vous êtes ici
                                </Badge>
                              ) : null}
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {row.recipient_name || '—'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="flex max-w-[min(100%,14rem)] flex-col gap-1.5">
                            <div className="shrink-0">
                              <CorridorFlags
                                originIso2={row.corridor?.origin_iso2}
                                destIso2={row.corridor?.dest_iso2}
                              />
                            </div>
                            <span className="text-xs leading-snug text-muted-foreground break-words">
                              {row.route_display || '—'}
                            </span>
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
                        <td className="px-3 py-2 align-top text-right tabular-nums text-xs">
                          {row.weight_kg != null && row.weight_kg !== undefined
                            ? `${Number(row.weight_kg).toFixed(1)} kg`
                            : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="min-w-0 space-y-2 md:hidden">
              {rows.map((row) => {
                const st = row.status?.code || ''
                const stColor = row.status?.color_hex || STATUS_COLORS[st] || '#64748B'
                const isCurrent = row.id === Number(shipmentId)
                return (
                  <div
                    key={row.id}
                    className={`rounded-lg border bg-background p-3 text-sm ${isCurrent ? 'border-primary/40 bg-primary/10' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Package className="h-4 w-4 text-muted-foreground" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <Link
                          to={`/shipments/${row.id}`}
                          className="block font-mono text-xs font-medium text-primary hover:underline break-all"
                        >
                          {row.public_tracking || `#${row.id}`}
                        </Link>
                        {isCurrent ? (
                          <Badge variant="secondary" className="text-[10px] w-fit">
                            Vous êtes ici
                          </Badge>
                        ) : null}
                        <p className="text-xs text-muted-foreground break-words">{row.recipient_name || '—'}</p>
                        <div className="flex max-w-full flex-col gap-1.5">
                          <CorridorFlags
                            originIso2={row.corridor?.origin_iso2}
                            destIso2={row.corridor?.dest_iso2}
                          />
                          <span className="text-xs leading-snug text-muted-foreground break-words">
                            {row.route_display || '—'}
                          </span>
                        </div>
                        {row.status ? (
                          <Badge
                            className="text-[10px] font-semibold w-fit"
                            style={{
                              backgroundColor: `${stColor}20`,
                              color: stColor,
                              borderColor: `${stColor}40`,
                            }}
                          >
                            {displayLocalized(row.status.name)}
                          </Badge>
                        ) : null}
                        <p className="text-xs font-medium tabular-nums text-muted-foreground">
                          Poids :{' '}
                          {row.weight_kg != null && row.weight_kg !== undefined
                            ? `${Number(row.weight_kg).toFixed(1)} kg`
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        ) : null}
      </Card>
    </motion.div>
  )
}
