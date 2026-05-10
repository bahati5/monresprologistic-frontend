import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api from '@/api/client'
import { useAuthStore } from '@/stores/authStore'
import {
  useRegroupementsIndex,
  useCreateRegroupement,
  useUpdateRegroupementStatus,
} from '@/hooks/useOperations'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ListCardsToggle } from '@/components/common/ListCardsToggle'
import { loadViewMode, saveViewMode, type ListOrCards } from '@/lib/listViewMode'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Layers } from 'lucide-react'
import { SuggestionGroupsPanel, type SuggestionGroup } from '@/components/operations/SuggestionGroupsPanel'
import { RegroupementCard } from '@/components/operations/RegroupementCard'
import { RegroupementListTable } from '@/components/operations/RegroupementListTable'
import { RegroupementStatusDialog } from '@/components/operations/RegroupementStatusDialog'

const VIEW_KEY = 'regroupements-list-view'

export default function RegroupementsPage() {
  const { user } = useAuthStore()
  const canSeeSuggestions = Boolean(
    user?.permissions?.some((p) =>
      ['create_regroupements', 'manage_regroupements', 'create_consolidations', 'manage_consolidations'].includes(p),
    ),
  )

  const { data: suggPayload } = useQuery({
    queryKey: ['regroupements', 'suggestions'],
    queryFn: () =>
      api
        .get<{ suggestions: SuggestionGroup[]; total_groups: number }>('/api/regroupements/suggestions')
        .then((r) => r.data),
    enabled: canSeeSuggestions,
  })

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

  const regroupements = useMemo(() => data?.regroupements ?? [], [data])
  const availableShipments = useMemo(() => data?.availableShipments ?? [], [data])
  const suggestions = suggPayload?.suggestions ?? []

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

      {canSeeSuggestions && suggestions.length > 0 ? (
        <SuggestionGroupsPanel
          suggestions={suggestions}
          onPreselGroup={(ids) => {
            setSelectedShipmentIds(new Set(ids))
            setCreateOpen(true)
          }}
        />
      ) : null}

      {viewMode === 'list' ? (
        <RegroupementListTable
          isLoading={isLoading}
          regroupements={regroupements}
          expandedLotIds={expandedLotIds}
          toggleLotExpanded={toggleLotExpanded}
          totalWeightByLot={totalWeightByLot}
          onOpenStatusDialog={(id) => {
            setStatusDialog(id)
            setSelectedStatus('')
          }}
        />
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
              {regroupements.map((c) => (
                <RegroupementCard
                  key={c.id}
                  regroupement={c}
                  totalWeight={totalWeightByLot.get(c.id) ?? 0}
                  expanded={expandedLotIds.has(c.id)}
                  onToggleExpand={() => toggleLotExpanded(c.id)}
                  onOpenStatus={() => {
                    setStatusDialog(c.id)
                    setSelectedStatus('')
                  }}
                />
              ))}
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

      <RegroupementStatusDialog
        regroupementId={statusDialog}
        onClose={() => setStatusDialog(null)}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        updateStatus={updateStatus}
        onConfirm={handleUpdateStatus}
      />
    </motion.div>
  )
}
