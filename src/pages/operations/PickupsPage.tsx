import { useState, useEffect, useMemo } from 'react'
import { ListCardsToggle } from '@/components/common/ListCardsToggle'
import { loadViewMode, saveViewMode, type ListOrCards } from '@/lib/listViewMode'
import { motion } from 'framer-motion'
import { usePickups, useCreatePickup, useAssignPickupDriver, useUpdatePickupStatus } from '@/hooks/useOperations'
import { useAssignableDrivers } from '@/hooks/useCrm'
import { useSearchClients } from '@/hooks/useShipments'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Package } from 'lucide-react'
import type { PaginatedData } from '@/types'
import { useAuthStore } from '@/stores/authStore'
import api from '@/api/client'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCheckExistingDraft, useDraftAutoSave } from '@/hooks/useDrafts'
import { PickupCard } from '@/components/operations/pickups/PickupCard'
import { CreatePickupDialog } from '@/components/operations/pickups/CreatePickupDialog'
import { PickupPhotoDialog } from '@/components/operations/pickups/PickupPhotoDialog'
import { PickupListTable } from '@/components/operations/pickups/PickupListTable'
import { PickupAssignDriverDialog } from '@/components/operations/pickups/PickupAssignDriverDialog'
import { PickupStatusDialog } from '@/components/operations/pickups/PickupStatusDialog'
import { googleMapsUrl } from '@/components/operations/pickups/googleMapsUrl'
import type { PickupRowModel } from '@/components/operations/pickups/PickupCard'

const VIEW_KEY = 'pickups-list-view'

export default function PickupsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const isDriver = Boolean(user?.roles?.includes('driver'))
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isLoading } = usePickups({ page, search: search || undefined })
  const createPickup = useCreatePickup()
  const assignDriver = useAssignPickupDriver()
  const updateStatus = useUpdatePickupStatus()
  const { data: driversRaw } = useAssignableDrivers({ enabled: !isDriver })
  const { data: clientsRaw } = useSearchClients('')

  const [createOpen, setCreateOpen] = useState(false)
  const [driverDialog, setDriverDialog] = useState<number | null>(null)
  const [statusDialog, setStatusDialog] = useState<{ id: number; currentStatus: string } | null>(null)
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [failureReason, setFailureReason] = useState('')
  const [completionNotes, setCompletionNotes] = useState('')
  const [photoDialog, setPhotoDialog] = useState<number | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [form, setForm] = useState<Record<string, unknown>>({})
  const [viewMode, setViewMode] = useState<ListOrCards>(() => loadViewMode(VIEW_KEY))

  useEffect(() => {
    saveViewMode(VIEW_KEY, viewMode)
  }, [viewMode])

  const uploadPhoto = useMutation({
    mutationFn: ({ pickupId, file }: { pickupId: number; file: File }) => {
      const fd = new FormData()
      fd.append('photo', file)
      return api.post(`/api/pickups/${pickupId}/completion-photo`, fd)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickups'] })
      setPhotoDialog(null)
      setPhotoFile(null)
      toast.success('Photo de preuve enregistrée.')
    },
    onError: () => toast.error('Erreur lors de l\'upload de la photo.'),
  })

  const pickups = (data?.data || []) as PickupRowModel[]
  const pagination: PaginatedData<unknown> = data ?? {
    data: [],
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
    from: null,
    to: null,
    links: [],
  }
  const driverList = driversRaw ?? []
  const clientList = Array.isArray(clientsRaw) ? clientsRaw : (clientsRaw as { clients?: typeof clientsRaw })?.clients || []

  const setFormField = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  const pickupFormData = useMemo(
    () => (createOpen && Object.keys(form).length > 0 ? form : null),
    [createOpen, form],
  )

  const { data: existingPickupDraft } = useCheckExistingDraft('pickup', !isDriver)
  const { lastSavedAt: pickupSavedAt, isSaving: pickupSaving, loadDraft: loadPickupDraft, clearAfterSubmit: clearPickupDraft } =
    useDraftAutoSave('pickup', pickupFormData, { enabled: createOpen })

  useEffect(() => {
    if (createOpen && existingPickupDraft && Object.keys(form).length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(existingPickupDraft.payload as Record<string, unknown>)
      loadPickupDraft(existingPickupDraft)
    }
  }, [createOpen, existingPickupDraft, form, loadPickupDraft])

  const handleCreate = () => {
    createPickup.mutate(form as never, {
      onSuccess: () => { clearPickupDraft(); setCreateOpen(false); setForm({}) },
    })
  }

  const handleAssignDriver = () => {
    if (!driverDialog || !selectedDriverId) return
    assignDriver.mutate(
      { id: driverDialog, driver_id: Number(selectedDriverId) },
      { onSuccess: () => { setDriverDialog(null); setSelectedDriverId('') } },
    )
  }

  const handleUpdateStatus = () => {
    if (!statusDialog || !selectedStatus) return
    updateStatus.mutate(
      { id: statusDialog.id, status: selectedStatus, failure_reason: failureReason || undefined, completion_notes: completionNotes || undefined },
      {
        onSuccess: () => { setStatusDialog(null); setSelectedStatus(''); setFailureReason(''); setCompletionNotes('') },
        onError: (err: Error) => {
          const ax = err as Error & { response?: { data?: { requires_photo?: boolean } } }
          if (ax.response?.data?.requires_photo) {
            toast.error('Photo de preuve obligatoire. Uploadez-la d\'abord.')
            setPhotoDialog(statusDialog.id)
          }
        },
      },
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ramassages</h1>
          <p className="text-sm text-muted-foreground">
            {pagination.total ?? 0} ramassage(s)
            {isDriver ? ' — missions qui vous sont assignées' : ''}
          </p>
        </div>
        {!isDriver ? (
          <Button onClick={() => { setForm({}); setCreateOpen(true) }}>
            <Plus size={16} className="mr-1.5" />Nouveau ramassage
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <ListCardsToggle mode={viewMode} onModeChange={setViewMode} />
      </div>

      {viewMode === 'list' ? (
        <PickupListTable
          isLoading={isLoading}
          pickups={pickups}
          isDriver={isDriver}
          mapsUrl={googleMapsUrl}
          onAssignDriver={(id) => { setDriverDialog(id); setSelectedDriverId('') }}
          onChangeStatus={(id, stCode) => {
            setStatusDialog({ id, currentStatus: stCode })
            setSelectedStatus('')
            setFailureReason('')
            setCompletionNotes('')
          }}
          onUploadPhoto={setPhotoDialog}
        />
      ) : (
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}><CardContent className="p-4 space-y-2"><div className="h-4 w-24 animate-pulse rounded bg-muted" /><div className="h-3 w-full animate-pulse bg-muted rounded" /></CardContent></Card>
              ))}
            </div>
          ) : pickups.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Package size={40} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">
                {isDriver ? 'Aucune mission assignée pour le moment.' : 'Aucun ramassage'}
              </p>
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pickups.map((p) => {
                const stCode = typeof p.status === 'string' ? p.status : p.status?.code || ''
                return (
                  <PickupCard
                    key={p.id}
                    pickup={p}
                    isDriver={isDriver}
                    mapsUrl={googleMapsUrl}
                    onAssignDriver={() => { setDriverDialog(p.id); setSelectedDriverId('') }}
                    onChangeStatus={() => {
                      setStatusDialog({ id: p.id, currentStatus: stCode })
                      setSelectedStatus('')
                      setFailureReason('')
                      setCompletionNotes('')
                    }}
                    onUploadPhoto={() => setPhotoDialog(p.id)}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}

      {(pagination.last_page ?? 1) > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Precedent</Button>
          <span className="text-sm text-muted-foreground">{page} / {pagination.last_page}</span>
          <Button variant="outline" size="sm" disabled={page >= (pagination.last_page ?? 1)} onClick={() => setPage(page + 1)}>Suivant</Button>
        </div>
      )}

      <CreatePickupDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        form={form}
        setField={setFormField}
        clientList={clientList as { id: number; name?: string | null }[]}
        pickupSavedAt={pickupSavedAt}
        pickupSaving={pickupSaving}
        onCreate={handleCreate}
        createPending={createPickup.isPending}
      />

      <PickupAssignDriverDialog
        open={!!driverDialog}
        onOpenChange={(open) => { if (!open) setDriverDialog(null) }}
        selectedDriverId={selectedDriverId}
        setSelectedDriverId={setSelectedDriverId}
        driverList={driverList as { id: number; name?: string | null }[]}
        onAssign={handleAssignDriver}
        assignPending={assignDriver.isPending}
      />

      <PickupStatusDialog
        open={!!statusDialog}
        onOpenChange={(open) => { if (!open) setStatusDialog(null) }}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        failureReason={failureReason}
        setFailureReason={setFailureReason}
        completionNotes={completionNotes}
        setCompletionNotes={setCompletionNotes}
        onConfirm={handleUpdateStatus}
        updatePending={updateStatus.isPending}
      />

      <PickupPhotoDialog
        pickupId={photoDialog}
        photoFile={photoFile}
        setPhotoFile={setPhotoFile}
        onClose={() => { setPhotoDialog(null); setPhotoFile(null) }}
        uploadPhoto={uploadPhoto}
      />
    </motion.div>
  )
}
