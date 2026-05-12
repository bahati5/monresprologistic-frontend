import { useState, useEffect } from 'react'
import { loadViewMode, saveViewMode, type ListOrCards } from '@/lib/listViewMode'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useShipments } from '@/hooks/useShipments'
import {
  useRegroupementsPicker,
  useAttachShipmentsToRegroupement,
  useCreateRegroupement,
} from '@/hooks/useOperations'
import { userCanManageRegroupementShipments } from '@/lib/permissions'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Layers, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import { useFormatMoney } from '@/hooks/useSettings'
import { ShipmentListFilters } from '@/components/shipments/list/ShipmentListFilters'
import { ShipmentListRow } from '@/components/shipments/list/ShipmentListRow'
import { ShipmentCard } from '@/components/shipments/list/ShipmentCard'
import { BulkRegroupementDialog } from '@/components/shipments/list/BulkRegroupementDialog'
import type { ShipmentTableRowModel } from '@/components/shipments/list/ShipmentListRow'

const VIEW_STORAGE_KEY = 'shipments-list-view'

export default function ShipmentsList() {
  const { formatMoney } = useFormatMoney()
  const { user, hasPermission } = useAuthStore()
  const canCreateShipment = hasPermission('shipments.create')
  const canBulkRegroupe = userCanManageRegroupementShipments(user)
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') || '1')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [viewMode, setViewMode] = useState<ListOrCards>(() => loadViewMode(VIEW_STORAGE_KEY))

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

  const shipments = (data?.data || []) as ShipmentTableRowModel[]
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

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
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
          {canCreateShipment ? (
            <Link to="/shipments/create">
              <Button><Plus size={16} className="mr-1.5" />Nouvelle expedition</Button>
            </Link>
          ) : null}
        </div>
      </div>

      <ShipmentListFilters
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        doSearch={doSearch}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {viewMode === 'list' && (
        <Card className="hidden md:block">
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
                    shipments.map((s) => (
                      <ShipmentListRow
                        key={s.id}
                        shipment={s}
                        canBulkRegroupe={canBulkRegroupe}
                        selectedIds={selectedIds}
                        setSelectedIds={setSelectedIds}
                        formatMoney={formatMoney}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className={viewMode === 'list' ? 'md:hidden' : undefined}>
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
              {shipments.map((s) => (
                <ShipmentCard
                  key={s.id}
                  shipment={s}
                  canBulkRegroupe={canBulkRegroupe}
                  selectedIds={selectedIds}
                  setSelectedIds={setSelectedIds}
                  formatMoney={formatMoney}
                />
              ))}
            </div>
          )}
      </div>

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

      <BulkRegroupementDialog
        open={attachExistingOpen}
        onOpenChange={setAttachExistingOpen}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        regroupePickerLoading={regroupePickerLoading}
        regroupementChoices={regroupementChoices}
        attachBulk={attachBulk}
        createRegroupement={createRegroupement}
        handleCreateLotFromSelection={handleCreateLotFromSelection}
      />
    </motion.div>
  )
}
