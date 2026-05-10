import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import api from '@/api/client'
import { AssistedShoppingForm, type AssistedShoppingFormValues } from '@/components/AssistedShoppingForm'
import { useAuthStore } from '@/stores/authStore'
import { useCheckExistingDraft, useDraftAutoSave, useDeleteDraft } from '@/hooks/useDrafts'
import type { FormDraft } from '@/hooks/useDrafts'
import { DraftStatusIndicator } from '@/components/drafts/DraftStatusIndicator'
import { DraftResumeDialog } from '@/components/drafts/DraftResumeDialog'
import { Button } from '@/components/ui/button'
import { Save } from 'lucide-react'

const STAFF_ROLES = ['super_admin', 'agency_admin', 'operator'] as const

export default function AssistedShoppingNewPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isStaff = Boolean(user?.roles?.some((r) => STAFF_ROLES.includes(r as (typeof STAFF_ROLES)[number])))

  const deleteDraft = useDeleteDraft()
  const [draftDialogOpen, setDraftDialogOpen] = useState(false)
  const [draftChecked, setDraftChecked] = useState(false)
  const [formData, setFormData] = useState<Record<string, unknown> | null>(null)
  const [initialValues, setInitialValues] = useState<AssistedShoppingFormValues | undefined>(undefined)

  const { data: existingDraft } = useCheckExistingDraft('assisted_purchase', !draftChecked)

  const { lastSavedAt, isSaving, saveDraftManually, loadDraft, clearAfterSubmit } =
    useDraftAutoSave('assisted_purchase', formData, { enabled: draftChecked })

  useEffect(() => {
    if (draftChecked) return

    const draftIdParam = searchParams.get('draft_id')
    if (draftIdParam && existingDraft && String(existingDraft.id) === draftIdParam) {
      setInitialValues(existingDraft.payload as AssistedShoppingFormValues)
      loadDraft(existingDraft)
      setDraftChecked(true)
      return
    }

    if (existingDraft) {
      setDraftDialogOpen(true)
    } else if (existingDraft === null) {
      setDraftChecked(true)
    }
  }, [existingDraft, draftChecked, searchParams, loadDraft])

  const handleResumeDraft = (draft: FormDraft) => {
    setInitialValues(draft.payload as AssistedShoppingFormValues)
    loadDraft(draft)
    setDraftDialogOpen(false)
    setDraftChecked(true)
  }

  const handleDiscardDraft = (draft: FormDraft) => {
    deleteDraft.mutate(draft.id)
    setDraftDialogOpen(false)
    setDraftChecked(true)
  }

  const handleValuesChange = useCallback((values: AssistedShoppingFormValues) => {
    setFormData(values as unknown as Record<string, unknown>)
  }, [])

  const onSubmit = async (data: AssistedShoppingFormValues) => {
    setIsSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        notes: data.notes?.trim() || undefined,
        items: data.items.map((it) => ({
          url: it.url.trim(),
          name: (it.name ?? '').trim(),
          options: it.options?.trim() || undefined,
          quantity: it.quantity,
          ...(it.merchant_id != null && Number.isFinite(it.merchant_id) ? { merchant_id: it.merchant_id } : {}),
        })),
      }
      if (isStaff && data.user_id != null && Number.isFinite(data.user_id)) {
        payload.user_id = data.user_id
      }

      await api.post('/api/assisted-purchases', payload)
      await clearAfterSubmit()
      toast.success(
        data.items.length > 1
          ? `Demande de ${data.items.length} articles envoy\u00E9e. Notre \u00E9quipe vous contactera.`
          : 'Demande envoy\u00E9e. Notre \u00E9quipe vous contactera.'
      )
      navigate('/purchase-orders')
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      toast.error(msg || "Impossible d'envoyer la demande.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <DraftResumeDialog
        draft={existingDraft ?? null}
        open={draftDialogOpen}
        onResume={handleResumeDraft}
        onDiscard={handleDiscardDraft}
        onOpenChange={setDraftDialogOpen}
      />
      <AssistedShoppingForm
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        isStaff={isStaff}
        initialValues={initialValues}
        onValuesChange={handleValuesChange}
        headerSlot={
          <DraftStatusIndicator lastSavedAt={lastSavedAt} isSaving={isSaving} />
        }
        actionsSlot={
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-12"
            onClick={saveDraftManually}
            disabled={isSaving}
          >
            <Save className="mr-1 h-4 w-4" />
            Enregistrer en brouillon
          </Button>
        }
      />
    </>
  )
}
