import { Fragment } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LotRouteFlags } from '@/lib/countryFlags'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, RefreshCw, Layers, Package, ChevronRight, ChevronDown } from 'lucide-react'
import { lotStatusDisplay } from '@/components/operations/regroupementDisplay'
import type { RegroupementListItem } from '@/components/operations/regroupementDisplay'
import { RegroupementNestedShipmentsTable } from '@/components/operations/RegroupementNestedShipmentsTable'

const COL_COLSPAN = 9

interface RegroupementListTableProps {
  isLoading: boolean
  regroupements: RegroupementListItem[]
  expandedLotIds: Set<number>
  toggleLotExpanded: (id: number) => void
  totalWeightByLot: Map<number, number>
  onOpenStatusDialog: (id: number) => void
}

export function RegroupementListTable({
  isLoading,
  regroupements,
  expandedLotIds,
  toggleLotExpanded,
  totalWeightByLot,
  onOpenStatusDialog,
}: RegroupementListTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-10 px-2 py-3" aria-label="Déplier" />
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">N° de lot</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Départ → arrivée</th>
                <th className="px-4 py-3 text-left font-medium">Expéditions</th>
                <th className="px-4 py-3 text-left font-medium">Poids estimé</th>
                <th className="px-4 py-3 text-left font-medium">Statut</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b">
                    {[...Array(COL_COLSPAN)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : regroupements.length === 0 ? (
                <tr>
                  <td colSpan={COL_COLSPAN} className="px-4 py-12 text-center">
                    <Layers size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground">Aucun regroupement</p>
                  </td>
                </tr>
              ) : (
                regroupements.map((c) => {
                  const { stColor, stLabel } = lotStatusDisplay(c)
                  const tw = totalWeightByLot.get(c.id) ?? 0
                  const open = expandedLotIds.has(c.id)
                  return (
                    <Fragment key={c.id}>
                      <tr className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-2 py-3 align-middle">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-expanded={open}
                            onClick={() => toggleLotExpanded(c.id)}
                          >
                            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </Button>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">#{c.id}</td>
                        <td className="px-4 py-3 font-mono font-medium">{c.batch_number || '—'}</td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex max-w-[min(100%,14rem)] flex-col gap-1.5">
                            {c.lot_route ? (
                              <div className="shrink-0">
                                <LotRouteFlags
                                  originIso2s={c.lot_route.origin_iso2s}
                                  destIso2s={c.lot_route.dest_iso2s}
                                  label={c.lot_route.label ?? undefined}
                                />
                              </div>
                            ) : null}
                            {c.lot_route?.label ? (
                              <span className="text-xs leading-snug text-muted-foreground break-words">{c.lot_route.label}</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="text-xs">
                            <Package size={10} className="mr-1" />
                            {c.shipments?.length ?? 0}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {tw > 0 ? `${tw.toFixed(1)} kg` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className="text-xs"
                            style={{
                              backgroundColor: `${stColor}20`,
                              color: stColor,
                              borderColor: `${stColor}40`,
                            }}
                          >
                            {stLabel}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal size={14} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onOpenStatusDialog(c.id)}>
                                <RefreshCw size={14} className="mr-2" />
                                Changer statut
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                      {open ? (
                        <tr className="border-b bg-muted/35">
                          <td colSpan={COL_COLSPAN} className="p-0">
                            <div className="px-4 py-3 sm:px-6 sm:py-4">
                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                Détail des expéditions du lot
                              </p>
                              <RegroupementNestedShipmentsTable shipments={c.shipments} />
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
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
