import { useCallback, useState, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/api/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DraftStatusIndicator } from '@/components/drafts/DraftStatusIndicator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  AdminShoppingQuoteView,
  type AdminShoppingQuotePayload,
  type AssistedQuotePreviewBody,
} from '@/components/shopping/AdminShoppingQuoteView'
import { ItemUnavailableDialog, PriceChangeDialog } from '@/components/shopping/quote/PostPaymentIncidentDialog'
import { RecipientProfileDialog, type RecipientProfileData } from '@/components/shopping/quote/RecipientProfileDialog'
import { buildShoppingQuoteClient } from '@/lib/assistedPurchaseQuote'
import { deriveAssistedPurchaseQuoteView } from '@/lib/assistedPurchaseQuotePage'
import { useAssistedPurchaseQuotePage } from '@/hooks/useAssistedPurchaseQuotePage'

export default function AssistedPurchaseQuotePage() {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [hubDialogOpen, setHubDialogOpen] = useState(false)
  const [hubWeightKg, setHubWeightKg] = useState('')
  const [hubPhotoFile, setHubPhotoFile] = useState<File | null>(null)
  const [itemUnavailableOpen, setItemUnavailableOpen] = useState(false)
  const [priceChangeOpen, setPriceChangeOpen] = useState(false)
  const [recipientDialogOpen, setRecipientDialogOpen] = useState(false)
  const [recipientMissingInfo, setRecipientMissingInfo] = useState<{
    missing_fields: string[]
    message: string
    client_profile: RecipientProfileData
  } | null>(null)

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
  } = useAssistedPurchaseQuotePage()

  const articleOptions = useMemo(() => {
    const purchase = data?.purchase
    if (!purchase) return []
    const items = (purchase as Record<string, unknown>).items as
      | Array<{ id: number; name?: string; url?: string }>
      | undefined
    return (items ?? []).map((item) => ({
      id: item.id,
      label: item.name || item.url || `Article #${item.id}`,
    }))
  }, [data?.purchase])

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

  const showPostPaymentActions = ['paid', 'ordered'].includes(derived.statusCode)

  const handleSend = async (payload: AdminShoppingQuotePayload) => {
    const useDynamicEngine =
      (Array.isArray(payload.dynamicLines) && payload.dynamicLines.length > 0) ||
      (Array.isArray(payload.articleAvailabilities) && payload.articleAvailabilities.length > 0)

    if (useDynamicEngine) {
      if (!payload.dynamicLines?.length) {
        toast.error(
          'Les lignes du devis ne sont pas synchronisées. Attendez une seconde ou modifiez une valeur dans « Lignes du devis », puis réessayez.',
        )
        return
      }
      await quoteDynamicMutation.mutateAsync({
        items: payload.lines.map((l) => {
          const avail = payload.articleAvailabilities?.find((a) => a.id === Number(l.id))
          return {
            id: Number(l.id),
            unit_price: l.unitPrice,
            quantity: l.quantity,
            availability_status: avail?.availability_status || 'exact',
            alternative_note: avail?.alternative_note || null,
          }
        }),
        lines: payload.dynamicLines.map((dl) => ({
          internal_code: dl.internal_code,
          name: dl.name,
          type: dl.type,
          calculation_base: dl.calculation_base || null,
          value: parseFloat(dl.value) || 0,
          is_visible_to_client: dl.is_visible_to_client,
        })),
        estimated_delivery: payload.estimatedDelivery || null,
        staff_message: payload.staffMessage || null,
        is_urgent: false,
        payment_methods_note: payload.paymentMethodsNote.trim() !== '' ? payload.paymentMethodsNote.trim() : null,
      })
    } else {
      await quoteMutation.mutateAsync({
        items: payload.lines.map((l) => ({
          id: Number(l.id),
          unit_price: l.unitPrice,
          quantity: l.quantity,
        })),
        service_fee: payload.serviceFee,
        bank_fee_percentage: payload.bankFeePercentage,
        payment_methods_note: payload.paymentMethodsNote.trim() !== '' ? payload.paymentMethodsNote.trim() : null,
      })
    }
    await clearAfterSubmit()
  }

  const handleEmailPreview = async (body: AssistedQuotePreviewBody) => {
    const { data: htmlData } = await api.post<{ html: string }>(
      `/api/assisted-purchases/${id}/quote-preview`,
      body,
    )
    return htmlData.html
  }

  const submitRecordedPayment = async () => {
    const normalized = paymentAmount.replace(/\s/g, '').replace(',', '.').trim()
    const amount = parseFloat(normalized)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Indiquez un montant valide.')
      return
    }
    try {
      await markPaidMutation.mutateAsync({
        amount,
        note: paymentNote.trim() !== '' ? paymentNote.trim() : null,
      })
      setPaymentDialogOpen(false)
    } catch {
      /* toast dans le hook */
    }
  }

  const submitHubReceived = async () => {
    const w = parseFloat(hubWeightKg.replace(/\s/g, '').replace(',', '.').trim())
    if (!Number.isFinite(w) || w <= 0) {
      toast.error('Indiquez un poids réel valide (kg).')
      return
    }
    if (!hubPhotoFile) {
      toast.error('Ajoutez une photo du colis à l’entrepôt (jpg, png ou webp).')
      return
    }
    try {
      await markHubReceivedMutation.mutateAsync({ actualWeightKg: w, hubPhoto: hubPhotoFile })
      setHubDialogOpen(false)
      setHubWeightKg('')
      setHubPhotoFile(null)
    } catch {
      /* toast dans le hook */
    }
  }

  const staffPaymentStatuses = new Set(['quoted', 'awaiting_payment', 'ordered', 'arrived_at_hub'])
  const remainingForPayments = derived.paymentSummary?.remaining ?? 0
  const showRecordPaymentAction =
    staffPaymentStatuses.has(derived.statusCode) && remainingForPayments > 0.000_001

  return (
    <>
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
      articles={derived.articles}
      clientNote={derived.clientNote}
      currency={derived.displayCurrency}
      canEdit={derived.canEdit}
      readonlyFinancialSummary={derived.readonlyFinancial}
      readonlyQuoteDetails={derived.readonlyDetails}
      initialBankFeePercentage={derived.initialBankPct}
      initialPaymentMethodsNote={derived.initialPaymentNote}
      isSending={quoteMutation.isPending || quoteDynamicMutation.isPending}
      onSendQuote={handleSend}
      onRequestEmailPreview={derived.canEdit ? handleEmailPreview : undefined}
      onQuoteDataChange={derived.canEdit ? handleQuoteDataChange : undefined}
      quoteServerDraftPayload={derived.canEdit ? quoteServerDraftPayload : null}
      quoteDraftsQuerySettled={derived.canEdit ? quoteDraftsQuerySettled : true}
      draftIndicator={
        derived.canEdit ? <DraftStatusIndicator lastSavedAt={lastSavedAt} isSaving={isSaving} /> : undefined
      }
      revisionHydration={derived.revisionHydration}
      paymentSummary={derived.paymentSummary}
      serverQuoteConfigurationLines={derived.serverQuoteConfigurationLines}
      lineEditorResetKey={derived.lineEditorResetKey}
      quoteSnapshotHistory={derived.quoteSnapshotHistory}
      dossierTimeline={derived.dossierTimeline}
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
      recordPaymentAction={
        showRecordPaymentAction
          ? {
              onOpen: () => {
                const rem = derived.paymentSummary?.remaining
                setPaymentAmount(rem != null && rem > 0 ? String(rem).replace('.', ',') : '')
                setPaymentNote('')
                setPaymentDialogOpen(true)
              },
              isPending: markPaidMutation.isPending,
            }
          : null
      }
      markHubReceivedAction={
        derived.statusCode === 'ordered'
          ? {
              onOpen: () => {
                setHubWeightKg('')
                setHubPhotoFile(null)
                setHubDialogOpen(true)
              },
              isPending: markHubReceivedMutation.isPending,
            }
          : null
      }
      headerActions={
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} />
            Retour
          </Button>
          {showPostPaymentActions && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                onClick={() => setItemUnavailableOpen(true)}
              >
                Article indisponible
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                onClick={() => setPriceChangeOpen(true)}
              >
                Changement de prix
              </Button>
            </>
          )}
        </div>
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
        derived.statusCode === 'arrived_at_hub' &&
        p.converted_shipment_id == null
          ? {
              onConvert: async () => {
                try {
                  const res = await convertToShipmentMutation.mutateAsync({ check_only: true })
                  const body = res.data as Record<string, unknown>
                  if (body.profile_complete === false) {
                    setRecipientMissingInfo({
                      missing_fields: (body.missing_fields as string[]) ?? [],
                      message: (body.message as string) ?? '',
                      client_profile: body.client_profile as RecipientProfileData,
                    })
                    setRecipientDialogOpen(true)
                    return
                  }
                  await convertToShipmentMutation.mutateAsync({})
                } catch {
                  // handled by mutation onError
                }
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
      pdfDownloadUrl={
        derived.statusCode !== 'pending_quote' && derived.statusCode !== 'cancelled'
          ? `/api/assisted-purchases/${id}/pdf/quote`
          : null
      }
    />

      <RecipientProfileDialog
        open={recipientDialogOpen}
        onOpenChange={setRecipientDialogOpen}
        purchaseId={id}
        missingInfo={recipientMissingInfo}
        onConvertWithOverrides={async (overrides) => {
          try {
            await convertToShipmentMutation.mutateAsync(overrides)
            setRecipientDialogOpen(false)
            setRecipientMissingInfo(null)
          } catch {
            // handled by mutation onError
          }
        }}
        isPending={convertToShipmentMutation.isPending}
      />

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
          </DialogHeader>
          {derived.paymentSummary && (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground text-xs">
                Total du devis :{' '}
                <span className="font-semibold text-foreground tabular-nums">
                  {derived.paymentSummary.totalQuote.toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  {derived.paymentSummary.currency}
                </span>
                {' · '}Déjà encaissé :{' '}
                <span className="font-medium tabular-nums">
                  {derived.paymentSummary.totalPaid.toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                {' · '}Solde restant :{' '}
                <span className="font-medium tabular-nums text-[#073763]">
                  {derived.paymentSummary.remaining.toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="pay-amt">Montant reçu</Label>
                <Input
                  id="pay-amt"
                  inputMode="decimal"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0,00"
                  disabled={markPaidMutation.isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pay-note">Commentaire (optionnel)</Label>
                <Textarea
                  id="pay-note"
                  rows={2}
                  className="text-sm resize-y min-h-[52px]"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Ex. acompte 30 % par virement…"
                  disabled={markPaidMutation.isPending}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={markPaidMutation.isPending}
              onClick={() => void submitRecordedPayment()}
            >
              {markPaidMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={hubDialogOpen} onOpenChange={setHubDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Réception au hub</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground text-xs">
              Passez le dossier en « Colis reçu à l’entrepôt ». Le poids réel et une photo sont obligatoires pour la
              traçabilité.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="hub-kg">Poids réel (kg)</Label>
              <Input
                id="hub-kg"
                inputMode="decimal"
                value={hubWeightKg}
                onChange={(e) => setHubWeightKg(e.target.value)}
                placeholder="Ex. 2,35"
                disabled={markHubReceivedMutation.isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hub-photo">Photo du colis</Label>
              <Input
                id="hub-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                disabled={markHubReceivedMutation.isPending}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  setHubPhotoFile(f ?? null)
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setHubDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              className="bg-green-700 hover:bg-green-800 text-white"
              disabled={markHubReceivedMutation.isPending}
              onClick={() => void submitHubReceived()}
            >
              {markHubReceivedMutation.isPending ? 'Envoi…' : 'Confirmer la réception'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ItemUnavailableDialog
        open={itemUnavailableOpen}
        onOpenChange={setItemUnavailableOpen}
        articles={articleOptions}
        isPending={reportItemUnavailableMutation.isPending}
        onSubmit={async (data) => {
          await reportItemUnavailableMutation.mutateAsync(data)
          setItemUnavailableOpen(false)
        }}
      />

      <PriceChangeDialog
        open={priceChangeOpen}
        onOpenChange={setPriceChangeOpen}
        articles={articleOptions}
        isPending={reportPriceChangeMutation.isPending}
        onSubmit={async (data) => {
          await reportPriceChangeMutation.mutateAsync(data)
          setPriceChangeOpen(false)
        }}
      />
    </>
  )
}
