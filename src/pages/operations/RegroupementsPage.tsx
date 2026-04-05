import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  useRegroupementsIndex,
  useCreateRegroupement,
  useUpdateRegroupementStatus,
  type RegroupementLotShipmentRow,
} from '@/hooks/useOperations'
import { STATUS_COLORS } from '@/lib/animations'
import { SHIPMENT_STATUS_FILTER_OPTIONS } from '@/types/shipment'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ListCardsToggle } from '@/components/common/ListCardsToggle'
import { loadViewMode, saveViewMode, type ListOrCards } from '@/lib/listViewMode'
import { LotRouteFlags, CorridorFlags } from '@/lib/countryFlags'
import { displayLocalized } from '@/lib/localizedString'
import {
  Plus, MoreHorizontal, RefreshCw, Layers, Package, ChevronRight, ChevronDown,
} from 'lucide-react'

const VIEW_KEY = 'regroupements-list-view'

export default function RegroupementsPage() {
  const { data, isLoading, refetch } = useRegroupementsIndex()
  const createRegroupement = useCreateRegroupement()
  const updateStatus = useUpdateRegroupementStatus()

  const [viewMode, setViewMode] = useState<ListOrCards>(() => loadViewMode(VIEW_KEY))
  const [expandedLotIds, setExpandedLotIds] = useState<Set<number>>(new Set())
  const [createOpen, setCreateOpen] = useState(false)
  const [statusDialog, setStatusDialog] = useState<number | null>(null)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    saveViewMode(VIEW_KEY, viewMode)
  }, [viewMode])

  const regroupements = data?.regroupements ?? []
  const availableShipments = data?.availableShipments ?? []

  const toggleLotExpanded = (id: number) => {
    setExpandedLotIds((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const toggleShipment = (id: number) => {
    setSelectedShipmentIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCreate = () => {
    const ids = [...selectedShipmentIds]
    if (ids.length < 1) return
    createRegroupement.mutate(
      { shipment_ids: ids },
      {
        onSuccess: () => {
          setCreateOpen(false)
          setSelectedShipmentIds(new Set())
          void refetch()
        },
      },
    )
  }

  const handleUpdateStatus = () => {
    if (!statusDialog || !selectedStatus) return
    updateStatus.mutate(
      { id: statusDialog, status: selectedStatus },
      {
        onSuccess: () => {
          setStatusDialog(null)
          setSelectedStatus('')
          void refetch()
        },
      },
    )
  }

  const totalWeightByLot = useMemo(() => {
    const m = new Map<number, number>()
    for (const r of regroupements) {
      const w = (r.shipments ?? []).reduce(
        (acc, s) => acc + Number(s.weight_kg ?? 0),
        0,
      )
      m.set(r.id, w)
    }
    return m
  }, [regroupements])

  const lotStatusDisplay = (c: (typeof regroupements)[number]) => {
    const stCode = typeof c.status === 'string' ? c.status : c.status?.code || ''
    const stColor = c.status?.color_hex || STATUS_COLORS[stCode] || '#64748B'
    const stLabel =
      (c.status && typeof c.status === 'object' && 'name' in c.status && c.status.name
        ? displayLocalized(c.status.name)
        : null)
      ?? SHIPMENT_STATUS_FILTER_OPTIONS.find((o) => o.code === stCode)?.name
      ?? stCode
      ?? '—'
    return { stCode, stColor, stLabel }
  }

  const COL_COLSPAN = 9

  const renderNestedShipments = (shipments: RegroupementLotShipmentRow[] | undefined) => (
    <div className="rounded-md border bg-background">
      <table className="w-full text-xs">
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

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Regroupements</h1>
          <p className="text-sm text-muted-foreground">{regroupements.length} lot(s) récent(s)</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <ListCardsToggle mode={viewMode} onModeChange={setViewMode} className="self-end sm:self-auto" />
          <Button
            onClick={() => {
              setSelectedShipmentIds(new Set())
              setCreateOpen(true)
            }}
          >
            <Plus size={16} className="mr-1.5" />
            Nouveau regroupement
          </Button>
        </div>
      </div>

      {viewMode === 'list' ? (
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
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setStatusDialog(c.id)
                                      setSelectedStatus('')
                                    }}
                                  >
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
                                  {renderNestedShipments(c.shipments)}
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
      ) : (
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : regroupements.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Layers size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">Aucun regroupement</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {regroupements.map((c) => {
                const { stColor, stLabel } = lotStatusDisplay(c)
                const tw = totalWeightByLot.get(c.id) ?? 0
                const open = expandedLotIds.has(c.id)
                return (
                  <Card key={c.id} className="overflow-hidden flex flex-col">
                    <CardContent className="p-4 flex flex-col gap-3 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground font-mono">#{c.id}</p>
                          <p className="font-mono text-base font-semibold tracking-tight truncate">{c.batch_number}</p>
                          <div className="mt-2 shrink-0">
                            {c.lot_route ? (
                              <LotRouteFlags
                                originIso2s={c.lot_route.origin_iso2s}
                                destIso2s={c.lot_route.dest_iso2s}
                                label={c.lot_route.label ?? undefined}
                              />
                            ) : null}
                          </div>
                          {c.lot_route?.label ? (
                            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground break-words">{c.lot_route.label}</p>
                          ) : null}
                        </div>
                        <Badge
                          className="text-xs shrink-0"
                          style={{
                            backgroundColor: `${stColor}20`,
                            color: stColor,
                            borderColor: `${stColor}40`,
                          }}
                        >
                          {stLabel}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          <Package size={10} className="mr-1" />
                          {c.shipments?.length ?? 0} expédition(s)
                        </Badge>
                        <span>{tw > 0 ? `${tw.toFixed(1)} kg` : 'Poids —'}</span>
                        <span>{c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : ''}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-auto pt-1">
                        <Button type="button" variant="outline" size="sm" onClick={() => toggleLotExpanded(c.id)}>
                          {open ? 'Masquer les colis' : 'Voir les colis'}
                          {open ? <ChevronDown className="ml-1 h-3 w-3" /> : <ChevronRight className="ml-1 h-3 w-3" />}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => { setStatusDialog(c.id); setSelectedStatus('') }}>
                          Statut
                        </Button>
                      </div>
                      {open ? <div className="pt-1 border-t border-border/80">{renderNestedShipments(c.shipments)}</div> : null}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau regroupement</DialogTitle>
            <DialogDescription className="sr-only">
              Choisissez au moins une expédition disponible pour former un lot (voyage / escales multiples possibles).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {availableShipments.length === 0
                ? 'Aucune expédition libre à regrouper pour le moment.'
                : 'Cochez les expéditions à inclure dans le nouveau lot.'}
            </p>
            <div className="rounded-md border max-h-[240px] overflow-y-auto divide-y">
              {availableShipments.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/40"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    checked={selectedShipmentIds.has(s.id)}
                    onChange={() => toggleShipment(s.id)}
                  />
                  <span className="font-mono text-xs">{s.public_tracking || `#${s.id}`}</span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                createRegroupement.isPending || selectedShipmentIds.size < 1 || availableShipments.length === 0
              }
            >
              {createRegroupement.isPending ? 'Création…' : 'Créer le lot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!statusDialog} onOpenChange={() => setStatusDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le statut du lot</DialogTitle>
            <DialogDescription className="sr-only">
              Le nouveau statut sera appliqué à toutes les expéditions du regroupement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nouveau statut</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">—</option>
                {SHIPMENT_STATUS_FILTER_OPTIONS.map((o) => (
                  <option key={o.code} value={o.code}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog(null)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateStatus} disabled={!selectedStatus || updateStatus.isPending}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
