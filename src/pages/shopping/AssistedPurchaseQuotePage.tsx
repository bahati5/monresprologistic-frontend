import { Navigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api from '@/api/client'
import { Button } from '@/components/ui/button'
import { DraftStatusIndicator } from '@/components/drafts/DraftStatusIndicator'
import {
  AdminShoppingQuoteView,
  type AdminShoppingQuotePayload,
  type AssistedQuotePreviewBody,
} from '@/components/shopping/AdminShoppingQuoteView'
import { buildShoppingQuoteClient } from '@/lib/assistedPurchaseQuote'
import { deriveAssistedPurchaseQuoteView } from '@/lib/assistedPurchaseQuotePage'
import { useAssistedPurchaseQuotePage } from '@/hooks/useAssistedPurchaseQuotePage'

export default function AssistedPurchaseQuotePage() {
  const {
    id,
    isStaff,
    appCurrency,
    navigate,
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
  } = useAssistedPurchaseQuotePage()

  if (!isStaff) {
    return <Navigate to="/purchase-orders" replace />
  }

  if (!id) {
    return <Navigate to="/purchase-orders" replace />
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="glass neo-raised rounded-xl h-14 animate-pulse" />
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="glass neo-raised rounded-xl h-64 animate-pulse" />
          <div className="glass neo-raised rounded-xl h-48 animate-pulse" />
        </div>
      </div>
    )
  }

  if (isError || !data?.purchase) {
    return (
      <div className="glass neo-raised rounded-xl p-6 text-sm">
        <p className="font-medium text-destructive">Demande introuvable ou accès refusé.</p>
        <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} />
          Retour
        </Button>
      </div>
    )
  }

  const p = data.purchase
  const derived = deriveAssistedPurchaseQuoteView(p, appCurrency)

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
    await clearAfterSubmit()
  }

  const handleEmailPreview = async (body: AssistedQuotePreviewBody) => {
    const { data: htmlData } = await api.post<{ html: string }>(
      `/api/assisted-purchases/${id}/quote-preview`,
      body,
    )
    return htmlData.html
  }

  return (
    <AdminShoppingQuoteView
      key={String(p.id)}
      requestId={String(p.id)}
      status={{
        code: derived.statusCode,
        label: derived.statusLabel,
        toneClassName: derived.toneClassName,
      }}
      client={buildShoppingQuoteClient(p)}
      lines={derived.lines}
      currency={derived.displayCurrency}
      canEdit={derived.canEdit}
      readonlyFinancialSummary={derived.readonlyFinancial}
      readonlyQuoteDetails={derived.readonlyDetails}
      initialBankFeePercentage={derived.initialBankPct}
      initialPaymentMethodsNote={derived.initialPaymentNote}
      isSending={quoteMutation.isPending}
      onSendQuote={handleSend}
      onRequestEmailPreview={derived.canEdit ? handleEmailPreview : undefined}
      onQuoteDataChange={derived.canEdit ? handleQuoteDataChange : undefined}
      draftIndicator={
        derived.canEdit ? <DraftStatusIndicator lastSavedAt={lastSavedAt} isSaving={isSaving} /> : undefined
      }
      resendQuoteAction={
        !derived.canEdit && derived.canResendQuote
          ? {
              onResend: () => {
                void resendMutation.mutateAsync()
              },
              isPending: resendMutation.isPending,
            }
          : null
      }
      markPaidAction={
        derived.statusCode === 'awaiting_payment'
          ? {
              onMarkPaid: () => {
                void markPaidMutation.mutateAsync()
              },
              isPending: markPaidMutation.isPending,
            }
          : null
      }
      headerActions={
        <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} />
          Retour
        </Button>
      }
      markOrderedAction={
        derived.statusCode === 'paid'
          ? {
              isSubmitting: markOrderedMutation.isPending,
              onSubmit: async (supplierTrackingNumber) => {
                await markOrderedMutation.mutateAsync(supplierTrackingNumber)
              },
            }
          : null
      }
      orderedSupplierTracking={
        derived.statusCode === 'ordered' &&
        typeof p.supplier_tracking_number === 'string' &&
        p.supplier_tracking_number.trim() !== ''
          ? p.supplier_tracking_number.trim()
          : null
      }
      convertToShipmentAction={
        (derived.statusCode === 'arrived_at_hub' || derived.statusCode === 'ordered') &&
        p.converted_shipment_id == null
          ? {
              onConvert: () => {
                void convertToShipmentMutation.mutateAsync()
              },
              isPending: convertToShipmentMutation.isPending,
            }
          : null
      }
      convertedShipmentId={p.converted_shipment_id != null ? Number(p.converted_shipment_id) : null}
      paymentProofUrl={
        typeof p.payment_proof_url === 'string' && p.payment_proof_url.trim() !== ''
          ? p.payment_proof_url.trim()
          : null
      }
    />
  )
}
