import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/api/client'
import { getApiErrorMessage } from '@/lib/apiErrors'
import { clearQuoteDraftSession, type QuoteEditDraftSnapshot } from '@/lib/quoteEditDraft'
import { useAuthStore } from '@/stores/authStore'
import { useDraftAutoSave, type FormDraft } from '@/hooks/useDrafts'
import { usePublicBranding } from '@/hooks/useSettings'

const STAFF_ROLES = ['super_admin', 'agency_admin', 'operator'] as const

type QuoteApiResponse = {
  message?: string
  mail_status?: { level?: string; message?: string }
}

export function useAssistedPurchaseQuotePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { data: branding } = usePublicBranding()
  const appCurrency = branding?.currency?.trim() || ''

  const isStaff = Boolean(user?.roles?.some((r) => STAFF_ROLES.includes(r as (typeof STAFF_ROLES)[number])))
  const [quoteFormData, setQuoteFormData] = useState<Record<string, unknown> | null>(null)

  const { lastSavedAt, isSaving, clearAfterSubmit: clearServerDraft, loadDraft } = useDraftAutoSave(
    'quote',
    quoteFormData,
    {
      enabled: isStaff && !!id,
      metadata: { assisted_purchase_id: id },
    },
  )

  const clearAfterSubmit = useCallback(async () => {
    if (id) clearQuoteDraftSession(id)
    await clearServerDraft()
  }, [id, clearServerDraft])

  const handleQuoteDataChange = useCallback((data: QuoteEditDraftSnapshot) => {
    setQuoteFormData(data as unknown as Record<string, unknown>)
  }, [])

  const draftsQuery = useQuery({
    queryKey: ['drafts', 'quote', id],
    queryFn: () =>
      api.get<{ data: FormDraft[] }>('/api/drafts', { params: { form_type: 'quote' } }).then((r) => r.data?.data ?? []),
    enabled: Boolean(isStaff && id),
  })

  const matchingQuoteDraft = useMemo(
    () =>
      draftsQuery.data?.find((d) => String(d.metadata?.assisted_purchase_id ?? '') === String(id)),
    [draftsQuery.data, id],
  )

  useEffect(() => {
    if (!matchingQuoteDraft) return
    loadDraft(matchingQuoteDraft)
  }, [matchingQuoteDraft?.id, loadDraft])

  const quoteDraftsQuerySettled = !isStaff || !id || !draftsQuery.isPending

  const quoteServerDraftPayload = matchingQuoteDraft?.payload ?? null

  const { data, isLoading, isError } = useQuery({
    queryKey: ['assisted-purchase', id],
    queryFn: () => api.get<{ purchase: Record<string, unknown> }>(`/api/assisted-purchases/${id}`).then((r) => r.data),
    enabled: Boolean(id) && isStaff,
  })

  const markOrderedMutation = useMutation({
    mutationFn: (supplier_tracking_number: string | null) =>
      api.post<{ message?: string; purchase?: Record<string, unknown> }>(
        `/api/assisted-purchases/${id}/mark-ordered`,
        { supplier_tracking_number },
      ),
    onSuccess: (res) => {
      toast.success(res.data?.message ?? 'Commande fournisseur enregistree. Le client a ete notifie.')
      void queryClient.invalidateQueries({ queryKey: ['assisted-purchase', id] })
      void queryClient.invalidateQueries({ queryKey: ['purchases'] })
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Impossible d'enregistrer la commande fournisseur."))
    },
  })

  const quoteSuccessHandler = (res: { data: QuoteApiResponse }) => {
    const resData = res.data
    const mail = resData?.mail_status
    const baseMsg = resData?.message ?? 'Devis enregistre.'
    if (mail?.level === 'error') {
      toast.error(mail.message || "L'e-mail n'a pas pu etre envoye au client.")
      toast.message(baseMsg)
    } else {
      toast.success(
        mail?.level === 'ok' ? `${baseMsg} Le client a ete notifie par e-mail.` : baseMsg,
      )
      if (mail?.level === 'warning' && mail.message) {
        toast.warning(mail.message)
      }
    }
    void queryClient.invalidateQueries({ queryKey: ['assisted-purchase', id] })
    void queryClient.invalidateQueries({ queryKey: ['purchases'] })
    void queryClient.invalidateQueries({ queryKey: ['drafts', 'quote', id] })
  }

  const quoteErrorHandler = (err: unknown) => {
    const msg =
      err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined
    toast.error(msg || "Impossible d'enregistrer le devis.")
  }

  const quoteMutation = useMutation({
    mutationFn: (payload: {
      items: { id: number; unit_price: number; quantity?: number }[]
      service_fee: number
      bank_fee_percentage: number
      payment_methods_note: string | null
    }) =>
      api.post<QuoteApiResponse>(`/api/assisted-purchases/${id}/quote`, payload),
    onSuccess: quoteSuccessHandler,
    onError: quoteErrorHandler,
  })

  const quoteDynamicMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<QuoteApiResponse>(`/api/assisted-purchases/${id}/quote-dynamic`, payload),
    onSuccess: quoteSuccessHandler,
    onError: quoteErrorHandler,
  })

  const resendMutation = useMutation({
    mutationFn: () =>
      api.post<{ message?: string; mail_status?: { level?: string; message?: string } }>(
        `/api/assisted-purchases/${id}/resend-quote`,
      ),
    onSuccess: (res) => {
      const resData = res.data
      const mail = resData?.mail_status
      const baseMsg = resData?.message ?? 'Devis renvoye au client.'
      if (mail?.level === 'error') {
        toast.error(mail.message || "L'e-mail n'a pas pu etre envoye.")
        toast.message(baseMsg)
      } else {
        toast.success(baseMsg)
        if (mail?.level === 'warning' && mail.message) {
          toast.warning(mail.message)
        }
      }
      void queryClient.invalidateQueries({ queryKey: ['assisted-purchase', id] })
      void queryClient.invalidateQueries({ queryKey: ['purchases'] })
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Impossible de renvoyer le devis.'))
    },
  })

  const markPaidMutation = useMutation({
    mutationFn: (body: { amount?: number; note?: string | null }) =>
      api.post<{ message?: string; purchase?: Record<string, unknown>; total_paid?: number; remaining?: number }>(
        `/api/assisted-purchases/${id}/mark-paid`,
        body,
      ),
    onSuccess: (res) => {
      toast.success(res.data?.message ?? 'Paiement enregistre comme recu.')
      void queryClient.invalidateQueries({ queryKey: ['assisted-purchase', id] })
      void queryClient.invalidateQueries({ queryKey: ['purchases'] })
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Impossible de valider le paiement.'))
    },
  })

  const convertToShipmentMutation = useMutation({
    mutationFn: (body?: { agency_id?: number }) =>
      api.post<{ message?: string; shipment_id?: number }>(
        `/api/assisted-purchases/${id}/convert-to-shipment`,
        body ?? {},
      ),
    onSuccess: (res) => {
      const shipmentId = res.data?.shipment_id
      toast.success(res.data?.message ?? 'Expedition creee avec succes.')
      void queryClient.invalidateQueries({ queryKey: ['assisted-purchase', id] })
      void queryClient.invalidateQueries({ queryKey: ['purchases'] })
      if (shipmentId) {
        navigate(`/shipments/${shipmentId}`)
      }
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Impossible de convertir en expedition."))
    },
  })

  const markHubReceivedMutation = useMutation({
    mutationFn: (body: { actualWeightKg: number; hubPhoto: File }) => {
      const fd = new FormData()
      fd.append('status', 'arrived_at_hub')
      fd.append('actual_weight_kg', String(body.actualWeightKg))
      fd.append('hub_photo', body.hubPhoto)
      return api.post<{ message?: string; purchase?: Record<string, unknown> }>(
        `/api/assisted-purchases/${id}/update-status`,
        fd,
      )
    },
    onSuccess: (res) => {
      toast.success(res.data?.message ?? 'Colis marqué comme reçu à l’entrepôt.')
      void queryClient.invalidateQueries({ queryKey: ['assisted-purchase', id] })
      void queryClient.invalidateQueries({ queryKey: ['purchases'] })
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Impossible de mettre à jour le statut (hub).'))
    },
  })

  const reportItemUnavailableMutation = useMutation({
    mutationFn: (body: {
      item_id: number
      resolution: 'wait_restock' | 'propose_alternative' | 'partial_refund' | 'full_refund'
      restock_date?: string | null
      alternative_description?: string | null
      staff_note?: string | null
    }) =>
      api.post<{ message?: string; purchase?: Record<string, unknown> }>(
        `/api/assisted-purchases/${id}/report-item-unavailable`,
        body,
      ),
    onSuccess: (res) => {
      toast.success(res.data?.message ?? 'Indisponibilite signalee au client.')
      void queryClient.invalidateQueries({ queryKey: ['assisted-purchase', id] })
      void queryClient.invalidateQueries({ queryKey: ['purchases'] })
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Impossible de signaler l'indisponibilite."))
    },
  })

  const reportPriceChangeMutation = useMutation({
    mutationFn: (body: {
      reason: string
      items: { id: number; new_price: number }[]
    }) =>
      api.post<{ message?: string; version?: number }>(
        `/api/assisted-purchases/${id}/report-price-change`,
        body,
      ),
    onSuccess: (res) => {
      toast.success(res.data?.message ?? 'Revision de prix creee. Le client doit re-accepter.')
      void queryClient.invalidateQueries({ queryKey: ['assisted-purchase', id] })
      void queryClient.invalidateQueries({ queryKey: ['purchases'] })
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Impossible de creer la revision de prix.'))
    },
  })

  return {
    id,
    navigate,
    isStaff,
    appCurrency,
    data,
    isLoading,
    isError,
    lastSavedAt,
    isSaving,
    clearAfterSubmit,
    quoteServerDraftPayload,
    quoteDraftsQuerySettled,
    handleQuoteDataChange,
    markOrderedMutation,
    quoteMutation,
    quoteDynamicMutation,
    resendMutation,
    markPaidMutation,
    convertToShipmentMutation,
    markHubReceivedMutation,
    reportItemUnavailableMutation,
    reportPriceChangeMutation,
  }
}
