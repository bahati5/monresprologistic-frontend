import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/api/client'
import { getApiErrorMessage } from '@/lib/apiErrors'
import { useAuthStore } from '@/stores/authStore'
import { useDraftAutoSave } from '@/hooks/useDrafts'
import { usePublicBranding } from '@/hooks/useSettings'

const STAFF_ROLES = ['super_admin', 'agency_admin', 'operator'] as const

export function useAssistedPurchaseQuotePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { data: branding } = usePublicBranding()
  const appCurrency = branding?.currency?.trim() ? branding.currency.trim() : 'EUR'

  const isStaff = Boolean(user?.roles?.some((r) => STAFF_ROLES.includes(r as (typeof STAFF_ROLES)[number])))
  const [quoteFormData, setQuoteFormData] = useState<Record<string, unknown> | null>(null)

  const { lastSavedAt, isSaving, clearAfterSubmit } = useDraftAutoSave('quote', quoteFormData, {
    enabled: isStaff && !!id,
    metadata: { assisted_purchase_id: id },
  })

  const handleQuoteDataChange = useCallback(
    (data: {
      unitPrices: Record<string, string>
      serviceFee: string
      bankFeePercentage: string
      paymentMethodsNote: string
    }) => {
      setQuoteFormData(data as unknown as Record<string, unknown>)
    },
    [],
  )

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
      toast.success(res.data?.message ?? 'Commande fournisseur enregistrée. Le client a été notifié.')
      void queryClient.invalidateQueries({ queryKey: ['assisted-purchase', id] })
      void queryClient.invalidateQueries({ queryKey: ['purchases'] })
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Impossible d’enregistrer la commande fournisseur.'))
    },
  })

  const quoteMutation = useMutation({
    mutationFn: (payload: {
      items: { id: number; unit_price: number }[]
      service_fee: number
      bank_fee_percentage: number
      payment_methods_note: string | null
    }) =>
      api.post<{
        message?: string
        mail_status?: { level?: string; message?: string }
      }>(`/api/assisted-purchases/${id}/quote`, payload),
    onSuccess: (res) => {
      const resData = res.data
      const mail = resData?.mail_status
      const baseMsg = resData?.message ?? 'Devis enregistré.'
      if (mail?.level === 'error') {
        toast.error(mail.message || "L'e-mail n'a pas pu être envoyé au client.")
        toast.message(baseMsg)
      } else {
        toast.success(
          mail?.level === 'ok' ? `${baseMsg} Le client a été notifié par e-mail.` : baseMsg,
        )
        if (mail?.level === 'warning' && mail.message) {
          toast.warning(mail.message)
        }
      }
      void queryClient.invalidateQueries({ queryKey: ['assisted-purchase', id] })
      void queryClient.invalidateQueries({ queryKey: ['purchases'] })
      navigate('/purchase-orders')
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      toast.error(msg || 'Impossible d’enregistrer le devis.')
    },
  })

  const resendMutation = useMutation({
    mutationFn: () =>
      api.post<{ message?: string; mail_status?: { level?: string; message?: string } }>(
        `/api/assisted-purchases/${id}/resend-quote`,
      ),
    onSuccess: (res) => {
      const resData = res.data
      const mail = resData?.mail_status
      const baseMsg = resData?.message ?? 'Devis renvoyé au client.'
      if (mail?.level === 'error') {
        toast.error(mail.message || "L'e-mail n'a pas pu être envoyé.")
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
    mutationFn: () =>
      api.post<{ message?: string; purchase?: Record<string, unknown> }>(
        `/api/assisted-purchases/${id}/mark-paid`,
      ),
    onSuccess: (res) => {
      toast.success(res.data?.message ?? 'Paiement enregistré comme reçu.')
      void queryClient.invalidateQueries({ queryKey: ['assisted-purchase', id] })
      void queryClient.invalidateQueries({ queryKey: ['purchases'] })
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Impossible de valider le paiement.'))
    },
  })

  const convertToShipmentMutation = useMutation({
    mutationFn: () =>
      api.post<{ message?: string; shipment_id?: number }>(
        `/api/assisted-purchases/${id}/convert-to-shipment`,
      ),
    onSuccess: (res) => {
      const shipmentId = res.data?.shipment_id
      toast.success(res.data?.message ?? 'Expédition créée avec succès.')
      void queryClient.invalidateQueries({ queryKey: ['assisted-purchase', id] })
      void queryClient.invalidateQueries({ queryKey: ['purchases'] })
      if (shipmentId) {
        navigate(`/shipments/${shipmentId}`)
      }
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Impossible de convertir en expédition.'))
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
    handleQuoteDataChange,
    markOrderedMutation,
    quoteMutation,
    resendMutation,
    markPaidMutation,
    convertToShipmentMutation,
  }
}
