import { useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import api from '@/api/client'
import { getApiErrorMessage } from '@/lib/apiErrors'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import {
  AdminShoppingQuoteView,
  type AdminShoppingQuotePayload,
  type AssistedQuotePreviewBody,
} from '@/components/shopping/AdminShoppingQuoteView'
import { usePublicBranding } from '@/hooks/useSettings'
import {
  buildQuoteLines,
  buildShoppingQuoteClient,
  computeReadonlyQuoteDetails,
  parseBankFeePercentage,
  purchaseStatusCode,
} from '@/lib/assistedPurchaseQuote'

const STAFF_ROLES = ['super_admin', 'agency_admin', 'operator'] as const

export default function AssistedPurchaseQuotePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { data: branding } = usePublicBranding()
  const appCurrency = branding?.currency?.trim() ? branding.currency.trim() : 'EUR'

  const isStaff = Boolean(user?.roles?.some((r) => STAFF_ROLES.includes(r as (typeof STAFF_ROLES)[number])))

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
    }) => api.post<{
      message?: string
      mail_status?: { level?: string; message?: string }
    }>(`/api/assisted-purchases/${id}/quote`, payload),
    onSuccess: (res) => {
      const data = res.data
      const mail = data?.mail_status
      const baseMsg = data?.message ?? 'Devis enregistré.'
      if (mail?.level === 'error') {
        toast.error(mail.message || "L'e-mail n'a pas pu être envoyé au client.")
        toast.message(baseMsg)
      } else {
        toast.success(
          mail?.level === 'ok'
            ? `${baseMsg} Le client a été notifié par e-mail.`
            : baseMsg,
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
      const data = res.data
      const mail = data?.mail_status
      const baseMsg = data?.message ?? 'Devis renvoyé au client.'
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

  if (!isStaff) {
    return <Navigate to="/purchase-orders" replace />
  }

  if (!id) {
    return <Navigate to="/purchase-orders" replace />
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-72 rounded-lg bg-muted animate-pulse" />
        <div className="h-48 rounded-xl border bg-card animate-pulse" />
        <div className="h-64 rounded-xl border bg-card animate-pulse" />
      </div>
    )
  }

  if (isError || !data?.purchase) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium text-destructive">Demande introuvable ou accès refusé.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/purchase-orders">Retour à la liste</Link>
        </Button>
      </div>
    )
  }

  const p = data.purchase
  const statusCode = purchaseStatusCode(p)
  const statusLabel =
    typeof p.status_label === 'string' && p.status_label.trim()
      ? p.status_label
      : statusCode
  const toneClassName = typeof p.status_color === 'string' ? p.status_color : undefined

  const canEdit = statusCode === 'pending_quote'
  const displayCurrency =
    !canEdit && typeof p.quote_currency === 'string' && p.quote_currency.trim() !== ''
      ? p.quote_currency.trim()
      : appCurrency
  const totalField = p.total_amount ?? p.quote_amount
  const quoteNum =
    totalField != null && totalField !== '' ? Number(totalField) : NaN
  const readonlyFinancial =
    !canEdit && Number.isFinite(quoteNum)
      ? {
          total: quoteNum,
          hint: 'Le client consulte le même détail sur sa page « Devis » et peut vous signaler le paiement.',
        }
      : null

  const lines = buildQuoteLines(p, canEdit, quoteNum)
  const initialBankPct = parseBankFeePercentage(p)
  const initialPaymentNote =
    typeof p.payment_methods_note === 'string' && p.payment_methods_note.trim() !== ''
      ? p.payment_methods_note.trim()
      : null
  const readonlyDetails = !canEdit ? computeReadonlyQuoteDetails(p) : null

  const quotedAtRaw = p.quoted_at
  const hasQuotedAt = quotedAtRaw != null && String(quotedAtRaw).trim() !== ''
  const canResendQuote =
    hasQuotedAt && statusCode !== 'pending_quote' && statusCode !== 'cancelled'

  const handleSend = async (payload: AdminShoppingQuotePayload) => {
    await quoteMutation.mutateAsync({
      items: payload.lines.map((l) => ({
        id: Number(l.id),
        unit_price: l.unitPrice,
      })),
      service_fee: payload.serviceFee,
      bank_fee_percentage: payload.bankFeePercentage,
      payment_methods_note: payload.paymentMethodsNote.trim() !== '' ? payload.paymentMethodsNote.trim() : null,
    })
  }

  const handleEmailPreview = async (body: AssistedQuotePreviewBody) => {
    const { data } = await api.post<{ html: string }>(`/api/assisted-purchases/${id}/quote-preview`, body)
    return data.html
  }

  return (
    <AdminShoppingQuoteView
      key={String(p.id)}
      requestId={String(p.id)}
      status={{ code: statusCode, label: statusLabel, toneClassName }}
      client={buildShoppingQuoteClient(p)}
      lines={lines}
      currency={displayCurrency}
      canEdit={canEdit}
      readonlyFinancialSummary={readonlyFinancial}
      readonlyQuoteDetails={readonlyDetails}
      initialBankFeePercentage={initialBankPct}
      initialPaymentMethodsNote={initialPaymentNote}
      isSending={quoteMutation.isPending}
      onSendQuote={handleSend}
      onRequestEmailPreview={canEdit ? handleEmailPreview : undefined}
      resendQuoteAction={
        !canEdit && canResendQuote
          ? {
              onResend: () => {
                void resendMutation.mutateAsync()
              },
              isPending: resendMutation.isPending,
            }
          : null
      }
      markPaidAction={
        statusCode === 'awaiting_payment'
          ? {
              onMarkPaid: () => {
                void markPaidMutation.mutateAsync()
              },
              isPending: markPaidMutation.isPending,
            }
          : null
      }
      headerActions={
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <Link to="/purchase-orders">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Retour
          </Link>
        </Button>
      }
      markOrderedAction={
        statusCode === 'paid'
          ? {
              isSubmitting: markOrderedMutation.isPending,
              onSubmit: async (supplierTrackingNumber) => {
                await markOrderedMutation.mutateAsync(supplierTrackingNumber)
              },
            }
          : null
      }
      orderedSupplierTracking={
        statusCode === 'ordered' &&
        typeof p.supplier_tracking_number === 'string' &&
        p.supplier_tracking_number.trim() !== ''
          ? p.supplier_tracking_number.trim()
          : null
      }
      convertToShipmentAction={
        (statusCode === 'arrived_at_hub' || statusCode === 'ordered') &&
        p.converted_shipment_id == null
          ? {
              onConvert: () => {
                void convertToShipmentMutation.mutateAsync()
              },
              isPending: convertToShipmentMutation.isPending,
            }
          : null
      }
      convertedShipmentId={
        p.converted_shipment_id != null ? Number(p.converted_shipment_id) : null
      }
      paymentProofUrl={
        typeof p.payment_proof_url === 'string' && p.payment_proof_url.trim() !== ''
          ? p.payment_proof_url.trim()
          : null
      }
    />
  )
}
