import { useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import api from '@/api/client'
import { getApiErrorMessage } from '@/lib/apiErrors'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { AdminShoppingQuoteView } from '@/components/shopping/AdminShoppingQuoteView'
import { usePublicBranding } from '@/hooks/useSettings'
import {
  buildQuoteLines,
  buildShoppingQuoteClient,
  computeReadonlyQuoteDetails,
  parseBankFeePercentage,
  purchaseStatusCode,
} from '@/lib/assistedPurchaseQuote'
import { clientQuoteHint } from '@/components/shopping/purchaseDetail/clientQuoteHint'
import { buildPendingQuoteRows } from '@/components/shopping/purchaseDetail/pendingQuoteRows'
import { PendingQuoteRequestView } from '@/components/shopping/purchaseDetail/PendingQuoteRequestView'
import { ConvertedToShipmentBanner } from '@/components/shopping/purchaseDetail/ConvertedToShipmentBanner'
import { ClientPaymentAckSection } from '@/components/shopping/purchaseDetail/ClientPaymentAckSection'
import { PurchaseDetailCommentsCard } from '@/components/shopping/purchaseDetail/PurchaseDetailCommentsCard'
import { PurchaseDetailLoadingState } from '@/components/shopping/purchaseDetail/PurchaseDetailLoadingState'
import { PurchaseDetailErrorState } from '@/components/shopping/purchaseDetail/PurchaseDetailErrorState'
import { PurchaseDetailCancelledState } from '@/components/shopping/purchaseDetail/PurchaseDetailCancelledState'

const STAFF_ROLES = ['super_admin', 'agency_admin', 'operator'] as const

export default function ClientAssistedPurchaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { data: branding } = usePublicBranding()
  const appCurrency = branding?.currency?.trim() ? branding.currency.trim() : 'EUR'
  const navigate = useNavigate()
  const [ackMessage, setAckMessage] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isStaff = Boolean(user?.roles?.some((r) => STAFF_ROLES.includes(r as (typeof STAFF_ROLES)[number])))

  const { data, isLoading, isError } = useQuery({
    queryKey: ['assisted-purchase', id],
    queryFn: () => api.get<{ purchase: Record<string, unknown> }>(`/api/assisted-purchases/${id}`).then((r) => r.data),
    enabled: Boolean(id) && !isStaff,
  })

  const ackMutation = useMutation({
    mutationFn: ({ message, file }: { message: string | null; file: File | null }) => {
      const formData = new FormData()
      if (message && message.trim() !== '') formData.append('message', message.trim())
      if (file) formData.append('payment_proof', file)
      return api.post(`/api/assisted-purchases/${id}/client-payment-ack`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: (res) => {
      toast.success(
        (res.data as { message?: string })?.message ??
          'Merci. Notre équipe a été prévenue et validera votre paiement sous peu.',
      )
      setAckMessage('')
      setProofFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      void queryClient.invalidateQueries({ queryKey: ['assisted-purchase', id] })
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Impossible d’envoyer la confirmation.'))
    },
  })

  if (isStaff && id) {
    return <Navigate to={`/purchase-orders/${id}/chiffrage`} replace />
  }

  if (!id) {
    return <Navigate to="/purchase-orders" replace />
  }

  if (isLoading) {
    return <PurchaseDetailLoadingState />
  }

  if (isError || !data?.purchase) {
    return <PurchaseDetailErrorState onBack={() => navigate(-1)} />
  }

  const p = data.purchase
  const statusCode = purchaseStatusCode(p)
  const statusLabel =
    typeof p.status_label === 'string' && p.status_label.trim()
      ? p.status_label
      : statusCode
  const toneClassName = typeof p.status_color === 'string' ? p.status_color : undefined

  if (statusCode === 'cancelled') {
    return <PurchaseDetailCancelledState onBack={() => navigate(-1)} />
  }

  if (statusCode === 'pending_quote') {
    const rows = buildPendingQuoteRows(p)
    return <PendingQuoteRequestView rows={rows} onBack={() => navigate(-1)} />
  }

  const canEdit = false
  const displayCurrency =
    typeof p.quote_currency === 'string' && p.quote_currency.trim() !== ''
      ? p.quote_currency.trim()
      : appCurrency
  const totalField = p.total_amount ?? p.quote_amount
  const quoteNum =
    totalField != null && totalField !== '' ? Number(totalField) : NaN
  const hint = clientQuoteHint(statusCode)
  const readonlyFinancial =
    Number.isFinite(quoteNum)
      ? {
          total: quoteNum,
          ...(hint ? { hint } : {}),
        }
      : null

  const lines = buildQuoteLines(p, canEdit, quoteNum)
  const initialBankPct = parseBankFeePercentage(p)
  const initialPaymentNote =
    typeof p.payment_methods_note === 'string' && p.payment_methods_note.trim() !== ''
      ? p.payment_methods_note.trim()
      : null
  const readonlyDetails = computeReadonlyQuoteDetails(p)

  const convertedShipmentId =
    p.converted_shipment_id != null ? Number(p.converted_shipment_id) : null
  const existingProofUrl =
    typeof p.payment_proof_url === 'string' && p.payment_proof_url.trim() !== ''
      ? p.payment_proof_url.trim()
      : null

  return (
    <div className="space-y-6">
      {statusCode === 'converted_to_shipment' && convertedShipmentId != null ? (
        <ConvertedToShipmentBanner
          convertedShipmentId={convertedShipmentId}
          onOpenShipment={(sid) => navigate(`/shipments/${sid}`)}
        />
      ) : null}

      <AdminShoppingQuoteView
        key={String(p.id)}
        requestId={String(p.id)}
        pageHeading={`Votre devis — demande n°${p.id}`}
        pageSubheading="Consultez le détail des montants et les instructions de paiement communiquées par notre équipe."
        clientSectionTitle="Votre compte"
        status={{ code: statusCode, label: statusLabel, toneClassName }}
        client={buildShoppingQuoteClient(p)}
        lines={lines}
        currency={displayCurrency}
        canEdit={canEdit}
        readonlyFinancialSummary={readonlyFinancial}
        readonlyQuoteDetails={readonlyDetails}
        initialBankFeePercentage={initialBankPct}
        initialPaymentMethodsNote={initialPaymentNote}
        headerActions={
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Retour
          </Button>
        }
      />

      {statusCode === 'awaiting_payment' ? (
        <ClientPaymentAckSection
          ackMessage={ackMessage}
          setAckMessage={setAckMessage}
          proofFile={proofFile}
          setProofFile={setProofFile}
          fileInputRef={fileInputRef}
          existingProofUrl={existingProofUrl}
          isPending={ackMutation.isPending}
          onSubmit={() =>
            void ackMutation.mutateAsync({ message: ackMessage, file: proofFile })
          }
        />
      ) : null}

      <PurchaseDetailCommentsCard purchaseId={Number(p.id)} />
    </div>
  )
}
