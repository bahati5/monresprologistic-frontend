import { useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Download, Loader2 } from 'lucide-react'
import api from '@/api/client'
import { getApiErrorMessage } from '@/lib/apiErrors'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminShoppingQuoteView } from '@/components/shopping/AdminShoppingQuoteView'
import { usePublicBranding } from '@/hooks/useSettings'
import {
  buildQuoteLines,
  buildShoppingQuoteClient,
  computeReadonlyQuoteDetails,
  parseBankFeePercentage,
  purchaseStatusCode,
} from '@/lib/assistedPurchaseQuote'
import { isPortalClientUser } from '@/lib/savPortalPaths'
import { fetchAssistedPurchaseQuoteHtml } from '@/lib/assistedPurchaseQuotePreview'
import { downloadApiPdf } from '@/lib/openPdf'
import { clientQuoteHint } from '@/components/shopping/purchaseDetail/clientQuoteHint'
import { buildPendingQuoteRows } from '@/components/shopping/purchaseDetail/pendingQuoteRows'
import { PendingQuoteRequestView } from '@/components/shopping/purchaseDetail/PendingQuoteRequestView'
import { ConvertedToShipmentBanner } from '@/components/shopping/purchaseDetail/ConvertedToShipmentBanner'
import { ClientPaymentAckSection } from '@/components/shopping/purchaseDetail/ClientPaymentAckSection'
import { PurchaseDetailCommentsCard } from '@/components/shopping/purchaseDetail/PurchaseDetailCommentsCard'
import { PurchaseDetailLoadingState } from '@/components/shopping/purchaseDetail/PurchaseDetailLoadingState'
import { PurchaseDetailErrorState } from '@/components/shopping/purchaseDetail/PurchaseDetailErrorState'
import { PurchaseDetailCancelledState } from '@/components/shopping/purchaseDetail/PurchaseDetailCancelledState'
import { ShipmentDocumentDigitalFrame } from '@/components/shipments/ShipmentDocumentDigitalFrame'

const STAFF_ROLES = ['super_admin', 'agency_admin', 'operator'] as const

export default function ClientAssistedPurchaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { data: branding } = usePublicBranding()
  const appCurrency = branding?.currency?.trim() || ''
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

  const purchaseForPreview = data?.purchase
  const quotePreviewEnabled =
    Boolean(id) &&
    !isStaff &&
    !!purchaseForPreview &&
    !['pending_quote', 'cancelled'].includes(purchaseStatusCode(purchaseForPreview))

  const quoteHtmlQuery = useQuery({
    queryKey: ['assisted-purchase-quote-html', id],
    queryFn: () => fetchAssistedPurchaseQuoteHtml(String(id), { suppressToast: true }),
    enabled: quotePreviewEnabled,
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
      toast.error(getApiErrorMessage(err, 'Impossible d\u2019envoyer la confirmation.'))
    },
  })

  if (isStaff && id) {
    return <Navigate to={`/purchase-orders/${id}/chiffrage`} replace />
  }

  if (!id) {
    return <Navigate to={isPortalClientUser(user) ? '/portal/achats' : '/purchase-orders'} replace />
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
    <div className="space-y-4">
      {statusCode === 'converted_to_shipment' && convertedShipmentId != null && (
        <ConvertedToShipmentBanner
          convertedShipmentId={convertedShipmentId}
          onOpenShipment={(sid) =>
            navigate(isPortalClientUser(user) ? `/portal/expeditions/${sid}` : `/shipments/${sid}`)
          }
        />
      )}

      <AdminShoppingQuoteView
        key={String(p.id)}
        requestId={String(p.id)}
        pageHeading={`Votre devis — demande n\u00B0${p.id}`}
        pageSubheading="Consultez le d\u00E9tail des montants et les instructions de paiement."
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
          <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} />
            Retour
          </Button>
        }
      />

      {quotePreviewEnabled ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Devis officiel (aperçu numérique)</CardTitle>
            <CardDescription>
              Même mise en page que le PDF ; vous pouvez aussi télécharger le fichier.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!id}
              onClick={() => {
                if (!id) return
                void downloadApiPdf(`/api/assisted-purchases/${id}/pdf/quote`, `devis-achat-assiste-${id}.pdf`)
              }}
            >
              <Download size={14} />
              Télécharger le PDF
            </Button>
            <div className="relative min-h-[280px] rounded-lg border bg-muted/10 overflow-hidden">
              {quoteHtmlQuery.isLoading ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : null}
              {quoteHtmlQuery.data ? (
                <ShipmentDocumentDigitalFrame
                  html={quoteHtmlQuery.data}
                  title="Devis achat assisté"
                  heightClass="h-[min(70vh,720px)] min-h-[280px]"
                  className="border-0 shadow-none rounded-lg"
                />
              ) : !quoteHtmlQuery.isLoading ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  Aperçu indisponible pour le moment (devis en cours de préparation ou non publié).
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {statusCode === 'awaiting_payment' && (
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
      )}

      <PurchaseDetailCommentsCard purchaseId={Number(p.id)} />
    </div>
  )
}
