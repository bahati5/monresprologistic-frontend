import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/api/client'
import { useCheckExistingDraft, useDraftAutoSave } from '@/hooks/useDrafts'
import { useRefundWorkflowMutations } from '@/hooks/useRefundWorkflowMutations'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuthStore } from '@/stores/authStore'
import { FileDown, PanelRight } from 'lucide-react'
import { RefundCard } from '@/components/finance/RefundCard'
import { RefundFilters } from '@/components/finance/RefundFilters'
import { RefundDetailPanel } from '@/components/finance/RefundDetailPanel'
import { RefundRequestDialog } from '@/components/finance/RefundRequestDialog'
import type { Refund, RefundListStatus } from '@/types/refund'
import type { FormDraft } from '@/hooks/useDrafts'
import { getApiErrorMessage } from '@/lib/apiError'
import type { QueryClient } from '@tanstack/react-query'

function ClientRefundRequestControls({
  initialDraft,
  queryClient,
}: {
  initialDraft: FormDraft | null
  queryClient: QueryClient
}) {
  const p = (initialDraft?.payload ?? {}) as Record<string, string>
  const [createOpen, setCreateOpen] = useState(false)
  const [dossierKey, setDossierKey] = useState(() => p.dossierKey ?? '')
  const [newAmount, setNewAmount] = useState(() => p.newAmount ?? '')
  const [newCurrency, setNewCurrency] = useState(() => p.newCurrency ?? '')
  const [newReason, setNewReason] = useState(() => p.newReason ?? '')
  const [newProof, setNewProof] = useState<File | null>(null)

  const refundFormData = useMemo(
    () =>
      createOpen && (dossierKey || newAmount || newReason)
        ? { dossierKey, newAmount, newCurrency, newReason }
        : null,
    [createOpen, dossierKey, newAmount, newCurrency, newReason],
  )

  const { lastSavedAt, isSaving, loadDraft, clearAfterSubmit } = useDraftAutoSave(
    'refund_request',
    refundFormData as Record<string, unknown> | null,
    { enabled: createOpen },
  )

  useEffect(() => {
    if (initialDraft) void loadDraft(initialDraft)
  }, [initialDraft, loadDraft])

  const { data: dossiersData, isLoading: dossiersLoading } = useQuery({
    queryKey: ['client-refund-dossiers'],
    queryFn: async () => {
      const [pRes, sRes] = await Promise.all([
        api.get<{ purchases: { data: { id: number; article_label?: string | null }[] } }>('/api/assisted-purchases', {
          params: { per_page: 100, tab: 'active' },
        }),
        api.get<{ shipments: { data: { id: number; tracking_number?: string | null }[] } }>('/api/shipments', {
          params: { per_page: 100 },
        }),
      ])
      return {
        purchases: pRes.data.purchases?.data ?? [],
        shipments: sRes.data.shipments?.data ?? [],
      }
    },
    enabled: createOpen,
  })

  const dossierOptions = useMemo(() => {
    const out: { key: string; label: string }[] = []
    for (const bp of dossiersData?.purchases ?? []) {
      const label = bp.article_label?.trim() || `Achat assisté #${bp.id}`
      out.push({ key: `assisted_purchase:${bp.id}`, label: `${label} (achat assisté)` })
    }
    for (const s of dossiersData?.shipments ?? []) {
      const tr = s.tracking_number?.trim() || `#${s.id}`
      out.push({ key: `shipment:${s.id}`, label: `${tr} (expédition)` })
    }
    return out
  }, [dossiersData])

  const createMutation = useMutation({
    mutationFn: async () => {
      const parts = dossierKey.split(':')
      const refundableType = parts[0]
      const refundableId = parts[1]
      if (!refundableType || !refundableId) {
        throw new Error('Sélectionnez un dossier.')
      }
      const fd = new FormData()
      fd.append('refundable_type', refundableType)
      fd.append('refundable_id', refundableId)
      fd.append('amount', newAmount)
      fd.append('currency', newCurrency)
      fd.append('reason', newReason)
      if (newProof) fd.append('request_proof', newProof)
      return api.post('/api/refunds', fd)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['refunds'] })
      toast.success('Demande enregistrée.')
      clearAfterSubmit()
      setCreateOpen(false)
      setDossierKey('')
      setNewAmount('')
      setNewReason('')
      setNewProof(null)
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Erreur'))
    },
  })

  return (
    <RefundRequestDialog
      open={createOpen}
      onOpenChange={(open) => {
        setCreateOpen(open)
        if (!open) {
          setDossierKey('')
          setNewAmount('')
          setNewReason('')
          setNewProof(null)
        }
      }}
      lastSavedAt={lastSavedAt}
      isSaving={isSaving}
      dossierKey={dossierKey}
      setDossierKey={setDossierKey}
      dossiersLoading={dossiersLoading}
      dossierOptions={dossierOptions}
      newAmount={newAmount}
      setNewAmount={setNewAmount}
      newCurrency={newCurrency}
      setNewCurrency={setNewCurrency}
      newReason={newReason}
      setNewReason={setNewReason}
      setNewProof={setNewProof}
      createMutation={createMutation}
    />
  )
}

export default function RefundsPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const isClient = user?.roles?.includes('client')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [rejectId, setRejectId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)

  const { data: refundDraft, isPending: refundDraftPending } = useCheckExistingDraft(
    'refund_request',
    isClient ?? false,
  )
  const refundDraftKey = refundDraftPending
    ? 'refund-draft-pending'
    : refundDraft
      ? `refund-draft-${refundDraft.id}`
      : 'refund-draft-empty'

  const { data, isLoading } = useQuery({
    queryKey: ['refunds', { search, status: statusFilter }],
    queryFn: () =>
      api.get('/api/refunds', { params: { search, status: statusFilter || undefined } }).then((r) => r.data),
  })

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['refund', detailId],
    queryFn: () =>
      api.get<{ refund: Refund & Record<string, unknown> }>(`/api/refunds/${detailId}`).then((r) => r.data.refund),
    enabled: Boolean(detailOpen && detailId),
  })

  const { approveMutation, rejectMutation, processMutation, completeMutation } = useRefundWorkflowMutations(
    detailId,
    setRejectId,
  )

  const refunds: Refund[] = data?.refunds?.data ?? []
  const statuses: RefundListStatus[] = data?.statuses ?? []

  const openDetail = (id: number) => {
    setDetailId(id)
    setDetailOpen(true)
  }

  const exportCsv = async () => {
    try {
      const res = await api.get('/api/refunds/export', {
        params: { search: search || undefined, status: statusFilter || undefined },
        responseType: 'blob',
      })
      const url = URL.createObjectURL(res.data as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `remboursements-${new Date().toISOString().slice(0, 10)}.csv`
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Export CSV lancé')
    } catch {
      toast.error('Export impossible')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Remboursements</h1>
        <div className="flex flex-wrap items-center gap-2">
          {!isClient ? (
            <Button type="button" variant="outline" onClick={() => void exportCsv()}>
              <FileDown className="mr-2 h-4 w-4" aria-hidden />
              Exporter CSV
            </Button>
          ) : null}
          {isClient ? (
            <ClientRefundRequestControls
              key={refundDraftKey}
              initialDraft={refundDraft ?? null}
              queryClient={qc}
            />
          ) : null}
        </div>
      </div>

      <RefundFilters
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        statuses={statuses}
      />

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) setDetailId(null)
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-hidden sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PanelRight className="h-4 w-4" aria-hidden />
              Détail remboursement
            </DialogTitle>
          </DialogHeader>
          <RefundDetailPanel detailLoading={detailLoading} detailData={detailData} />
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : refunds.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Aucun remboursement trouvé.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {refunds.map((refund) => (
            <RefundCard
              key={refund.id}
              refund={refund}
              isClient={isClient}
              onOpenDetail={openDetail}
              rejectId={rejectId}
              setRejectId={setRejectId}
              rejectReason={rejectReason}
              setRejectReason={setRejectReason}
              approveMutation={approveMutation}
              rejectMutation={rejectMutation}
              processMutation={processMutation}
              completeMutation={completeMutation}
            />
          ))}
        </div>
      )}
    </div>
  )
}
