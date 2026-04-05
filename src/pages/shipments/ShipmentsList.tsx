import { useState, useEffect } from 'react'
import { loadViewMode, saveViewMode } from '@/lib/listViewMode'
import { ListCardsToggle } from '@/components/common/ListCardsToggle'
import { CorridorFlags } from '@/lib/countryFlags'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useShipments } from '@/hooks/useShipments'
import {
  useRegroupementsPicker,
  useAttachShipmentsToRegroupement,
  useCreateRegroupement,
} from '@/hooks/useOperations'
import { SHIPMENT_STATUS_FILTER_OPTIONS } from '@/types/shipment'
import { STATUS_COLORS } from '@/lib/animations'
import { userCanManageRegroupementShipments } from '@/lib/permissions'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Plus, Search, Eye, MoreHorizontal, FileText, Printer,
  Copy, Package, Truck, ChevronLeft, ChevronRight, Layers,
  LayoutGrid, List,
} from 'lucide-react'
import { toast } from 'sonner'
import { displayLocalized } from '@/lib/localizedString'
import { useFormatMoney } from '@/hooks/useSettings'
import { downloadApiPdf } from '@/lib/openPdf'

const VIEW_STORAGE_KEY = 'shipments-list-view'

export default function ShipmentsList() {
  const navigate = useNavigate()
  const { formatMoney } = useFormatMoney()
  const { user } = useAuthStore()
  const canBulkRegroupe = userCanManageRegroupementShipments(user)
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') || '1')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>(() => loadViewMode(VIEW_STORAGE_KEY))

  useEffect(() => {
    saveViewMode(VIEW_STORAGE_KEY, viewMode)
  }, [viewMode])

  const filters = {
    page,
    per_page: 25,
    search: searchParams.get('search') || undefined,
    status: statusFilter || undefined,
  }

  const { data, isLoading } = useShipments(filters)

  const shipments = data?.data || []
  const pagination = data || {}

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [attachExistingOpen, setAttachExistingOpen] = useState(false)
  const { data: regroupePicker, isLoading: regroupePickerLoading } = useRegroupementsPicker(
    attachExistingOpen && canBulkRegroupe,
  )
  const attachBulk = useAttachShipmentsToRegroupement()
  const createRegroupement = useCreateRegroupement()

  const regroupementChoices = regroupePicker?.regroupements ?? []

  const doSearch = () => {
    const p: Record<string, string> = { page: '1' }
    if (search) p.search = search
    if (statusFilter) p.status = statusFilter
    setSearchParams(p)
  }

  const goPage = (p: number) => {
    const params: Record<string, string> = { page: String(p) }
    if (search) params.search = search
    if (statusFilter) params.status = statusFilter
    setSearchParams(params)
  }

  const handleCreateLotFromSelection = () => {
    const ids = [...selectedIds]
    if (ids.length < 1) return
    createRegroupement.mutate(
      { shipment_ids: ids },
      {
        onSuccess: () => setSelectedIds(new Set()),
      },
    )
  }

  /** Champs dérivés réutilisés en liste et en cartes */
  function shipmentDisplay(s: any) {
    const stCode = s.status?.code || ''
    const stColor = STATUS_COLORS[stCode] || s.status?.color_hex || s.status?.color || '#64748B'
    const tracking = s.tracking_number || s.public_tracking
    const senderLabel =
      s.sender_name
      || s.sender?.name
      || s.sender_client?.display_name
      || s.client?.name
      || [s.sender_client?.first_name, s.sender_client?.last_name].filter(Boolean).join(' ')
    const recipientLabel =
      s.recipient_name
      || s.delivery_recipient?.name
      || s.recipient?.name
    const recipientCity =
      s.recipient_city
      || s.delivery_recipient?.city
    const modeLabel = s.shipping_mode ?? s.service_type?.name
    const amount = s.total ?? s.calculated_price
    const eligibleRegroupe = !s.regroupement_id && !s.master_shipment_id
    return {
      stCode,
      stColor,
      tracking,
      senderLabel,
      recipientLabel,
      recipientCity,
      modeLabel,
      amount,
      eligibleRegroupe,
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expeditions</h1>
          <p className="text-sm text-muted-foreground">{(pagination as { total?: number }).total ?? 0} expedition(s) au total</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canBulkRegroupe && selectedIds.size > 0 ? (
            <>
              <Button
                variant="default"
                onClick={handleCreateLotFromSelection}
                disabled={createRegroupement.isPending}
              >
                <Layers size={16} className="mr-1.5" />
                {createRegroupement.isPending ? 'Création…' : `Nouveau lot (${selectedIds.size})`}
              </Button>
              <Button variant="secondary" onClick={() => setAttachExistingOpen(true)}>
                <Layers size={16} className="mr-1.5" />
                Lot existant ({selectedIds.size})
              </Button>
            </>
          ) : null}
          <Link to="/shipments/create">
            <Button><Plus size={16} className="mr-1.5" />Nouvelle expedition</Button>
          </Link>
        </div>
      </div>

      {/* Filters + vue */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par tracking, client..."
              className="pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') doSearch() }}
            />
          </div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v === 'all' ? '' : v); setTimeout(doSearch, 0) }}>
            <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {SHIPMENT_STATUS_FILTER_OPTIONS.map((st) => (
                <SelectItem key={st.code} value={st.code}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[st.code] || '#64748b' }} />
                    {st.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={doSearch}>Rechercher</Button>
        </div>
        <ListCardsToggle mode={viewMode} onModeChange={setViewMode} />
      </div>

      {/* Contenu : tableau ou grille */}
      {viewMode === 'list' ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {canBulkRegroupe ? (
                      <th className="w-14 min-w-[3.5rem] px-3 py-3 text-center font-medium" aria-label="Sélection" />
                    ) : null}
                    <th className="px-4 py-3 text-left font-medium">Tracking</th>
                    <th className="px-4 py-3 text-left font-medium">Expediteur</th>
                    <th className="px-4 py-3 text-left font-medium">Destinataire</th>
                    <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Départ → arrivée</th>
                    <th className="px-4 py-3 text-left font-medium">Mode</th>
                    <th className="px-4 py-3 text-left font-medium">Statut</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b">
                        {[...Array(canBulkRegroupe ? 10 : 9)].map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-muted" /></td>
                        ))}
                      </tr>
                    ))
                  ) : shipments.length === 0 ? (
                    <tr>
                      <td colSpan={canBulkRegroupe ? 10 : 9} className="px-4 py-12 text-center">
                        <Package size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                        <p className="text-muted-foreground">Aucune expedition trouvee</p>
                      </td>
                    </tr>
                  ) : (
                    shipments.map((s: any) => {
                      const d = shipmentDisplay(s)
                      return (
                        <tr key={s.id} className="border-b hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => navigate(`/shipments/${s.id}`)}>
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
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-full animate-pulse rounded bg-muted" />
                    <div className="h-3 w-48 max-w-full animate-pulse rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : shipments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">Aucune expedition trouvee</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shipments.map((s: any) => {
                const d = shipmentDisplay(s)
                return (
                  <Card
                    key={s.id}
                    className="overflow-hidden transition-shadow hover:shadow-md cursor-pointer group"
                    onClick={() => navigate(`/shipments/${s.id}`)}
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
              })}
            </div>
          )}
        </div>
      )}

      {/* Pagination + plage (toujours si total connu) */}
      {((pagination as { total?: number }).total ?? 0) > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {(pagination as { from?: number }).from ?? 1}–{(pagination as { to?: number }).to ?? shipments.length} sur {(pagination as { total?: number }).total}
            {((pagination as { last_page?: number }).last_page ?? 1) > 1 && ` · Page ${page} / ${(pagination as { last_page?: number }).last_page}`}
          </p>
          {((pagination as { last_page?: number }).last_page ?? 1) > 1 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goPage(page - 1)}>
                <ChevronLeft size={14} className="mr-1" />Precedent
              </Button>
              <Button variant="outline" size="sm" disabled={page >= ((pagination as { last_page?: number }).last_page ?? 1)} onClick={() => goPage(page + 1)}>
                Suivant<ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={attachExistingOpen} onOpenChange={setAttachExistingOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter à un lot existant</DialogTitle>
            <DialogDescription>
              Les {selectedIds.size} expédition(s) sélectionnée(s) seront rattachées au lot choisi.
            </DialogDescription>
          </DialogHeader>
          {regroupePickerLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Chargement…</p>
          ) : regroupementChoices.length === 0 ? (
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">
                Aucun lot ouvert pour l’instant. Utilisez « Nouveau lot » depuis la liste pour en créer un sans quitter cette page.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[min(50vh,360px)] pr-2">
              <ul className="space-y-2">
                {regroupementChoices.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-medium truncate">{r.batch_number}</p>
                      <p className="text-xs text-muted-foreground">{r.shipments?.length ?? 0} colis</p>
                    </div>
                    <Button
                      size="sm"
                      disabled={attachBulk.isPending}
                      onClick={() => {
                        attachBulk.mutate(
                          { regroupementId: r.id, shipmentIds: [...selectedIds] },
                          {
                            onSuccess: () => {
                              setAttachExistingOpen(false)
                              setSelectedIds(new Set())
                            },
                          },
                        )
                      }}
                    >
                      Utiliser ce lot
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => {
                setAttachExistingOpen(false)
                handleCreateLotFromSelection()
              }}
              disabled={createRegroupement.isPending || selectedIds.size < 1}
            >
              Créer un nouveau lot plutôt
            </Button>
            <Button type="button" variant="outline" onClick={() => setAttachExistingOpen(false)}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
