import { motion } from 'framer-motion'
import { History } from 'lucide-react'

import { QuoteActionsBar } from '@/components/shopping/quote/QuoteActionsBar'
import { QuoteClientCard } from '@/components/shopping/quote/QuoteClientCard'
import { QuoteEditPanel } from '@/components/shopping/quote/QuoteEditPanel'
import { QuoteEmailPreviewDialog } from '@/components/shopping/quote/QuoteEmailPreviewDialog'
import { QuoteFinancialForm } from '@/components/shopping/quote/QuoteFinancialForm'
import { QuoteMarkOrderedDialog } from '@/components/shopping/quote/QuoteMarkOrderedDialog'
import { useAdminShoppingQuoteViewState } from '@/components/shopping/quote/useAdminShoppingQuoteViewState'
import { Badge } from '@/components/ui/badge'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import { cn } from '@/lib/utils'
import { useFormatMoney } from '@/hooks/useSettings'

import type { AdminShoppingQuoteViewProps } from '@/types/shopping'
import type { PurchaseArticle } from '@/types/assistedPurchase'

export type {
  AdminQuoteLine,
  AdminQuoteStatus,
  AdminShoppingQuotePayload,
  ReadonlyQuoteFinancialDetails,
  AssistedQuotePreviewBody,
  ShoppingQuoteClientDetail,
  AdminShoppingQuoteViewProps,
} from '@/types/shopping'

export { DEFAULT_PAYMENT_METHODS_NOTE } from '@/constants/shopping'

export function AdminShoppingQuoteView({
  requestId,
  status,
  client,
  lines,
  articles,
  clientNote,
  currency,
  currencyDisplay,
  canEdit = true,
  isSending = false,
  onSendQuote,
  onRequestEmailPreview,
  headerActions,
  readonlyFinancialSummary = null,
  initialBankFeePercentage = 3,
  initialPaymentMethodsNote = null,
  readonlyQuoteDetails = null,
  markOrderedAction = null,
  orderedSupplierTracking = null,
  pageHeading,
  pageSubheading,
  resendQuoteAction = null,
  recordPaymentAction = null,
  markHubReceivedAction = null,
  clientSectionTitle = 'Client',
  convertToShipmentAction = null,
  convertedShipmentId = null,
  paymentProofUrl = null,
  onQuoteDataChange,
  quoteServerDraftPayload = null,
  quoteDraftsQuerySettled = true,
  draftIndicator,
  pdfDownloadUrl = null,
  revisionHydration = null,
  paymentSummary = null,
  serverQuoteConfigurationLines = null,
  lineEditorResetKey = '1-0',
  quoteSnapshotHistory = [],
  dossierTimeline = [],
}: AdminShoppingQuoteViewProps & {
  articles?: PurchaseArticle[]
  clientNote?: string | null
}) {
  const { formatMoney, branding } = useFormatMoney()
  const vm = useAdminShoppingQuoteViewState({
    requestId,
    status,
    lines,
    articles,
    clientNote,
    currency,
    currencyDisplay,
    canEdit,
    isSending,
    onSendQuote,
    onRequestEmailPreview,
    initialBankFeePercentage,
    initialPaymentMethodsNote,
    markOrderedAction,
    pageHeading,
    pageSubheading,
    onQuoteDataChange,
    formatMoney,
    brandingCurrency: branding?.currency,
    brandingSymbol: branding?.currency_symbol ?? '',
    quoteServerDraftPayload,
    quoteDraftsQuerySettled,
    revisionHydration,
  })

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {/* TOP BAR: Header compact + statut + actions */}
      <motion.div variants={fadeInUp} className="glass neo-raised rounded-xl px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            {headerActions}
            <h1 className="text-lg font-semibold tracking-tight text-foreground whitespace-nowrap">
              {vm.resolvedHeading}
            </h1>
            <Badge
              className={cn(
                'text-[11px] font-semibold px-2 py-0.5 shrink-0',
                status.toneClassName?.trim()
                  ? cn(status.toneClassName, 'border-0')
                  : 'border',
              )}
              style={status.toneClassName?.trim() ? undefined : vm.badgeStyle}
            >
              {status.label}
            </Badge>
            {draftIndicator}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <QuoteActionsBar
              group="afterClient"
              convertedShipmentId={convertedShipmentId}
              convertToShipmentAction={convertToShipmentAction}
              confirmConvertOpen={vm.confirmConvertOpen}
              onConfirmConvertOpenChange={vm.setConfirmConvertOpen}
              resendQuoteAction={resendQuoteAction}
              recordPaymentAction={recordPaymentAction}
              markHubReceivedAction={markHubReceivedAction}
              paymentProofUrl={paymentProofUrl}
              pdfDownloadUrl={pdfDownloadUrl}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-2">{vm.resolvedSubheading}</p>

        <QuoteMarkOrderedDialog
          statusCode={status.code}
          orderedSupplierTracking={orderedSupplierTracking}
          markOrderedAction={markOrderedAction}
          supplierTrackingInput={vm.supplierTrackingInput}
          onSupplierTrackingChange={vm.setSupplierTrackingInput}
          confirmOrderWithoutTracking={vm.confirmOrderWithoutTracking}
          onConfirmOrderWithoutTrackingChange={vm.setConfirmOrderWithoutTracking}
          onMarkOrderedClick={vm.handleMarkOrderedClick}
          onSubmitMarkOrdered={vm.submitMarkOrdered}
        />
      </motion.div>

      {/* BODY: 2 colonnes — Articles (main) + Client & Synthèse (sidebar) */}
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Colonne principale: Articles + actions envoi */}
        <motion.div variants={fadeInUp} className="min-w-0">
          {vm.usesDynamicLines ? (
            <QuoteEditPanel
              requestId={requestId}
              lines={lines}
              articles={vm.enrichedArticles}
              clientNote={vm.clientNote}
              currency={currency ?? ''}
              curLabel={vm.curLabel ?? ''}
              money={vm.money}
              canEdit={vm.canEdit}
              unitPrices={vm.unitPrices}
              onUnitPriceChange={vm.handleUnitChange}
              quantities={vm.quantities}
              onQuantityChange={vm.handleQuantityChange}
              paymentMethodsNote={vm.paymentMethodsNote}
              onPaymentMethodsNoteChange={vm.setPaymentMethodsNote}
              estimatedDelivery={vm.estimatedDelivery}
              onEstimatedDeliveryChange={vm.setEstimatedDelivery}
              staffMessage={vm.staffMessage}
              onStaffMessageChange={vm.setStaffMessage}
              onQuoteTotalChange={vm.handleQuoteTotalChange}
              onQuoteLinesChange={vm.handleQuoteLinesChange}
              onAvailabilityChange={vm.handleAvailabilityChange}
              quoteLineEditorReady={vm.quoteLineEditorReady}
              prefillDynamicQuoteLines={vm.prefillDynamicQuoteLines}
              serverQuoteConfigurationLines={serverQuoteConfigurationLines}
              lineEditorResetKey={lineEditorResetKey}
              paymentSummary={paymentSummary}
              quoteSendActions={
                vm.onSendQuote && vm.canEdit ? (
                  <QuoteActionsBar
                    group="afterFinancial"
                    canEdit={vm.canEdit}
                    linesLength={lines.length}
                    isSending={vm.isSending}
                    previewLoading={vm.previewLoading}
                    onSendQuote={vm.onSendQuote}
                    onRequestEmailPreview={vm.onRequestEmailPreview}
                    onPreviewEmail={vm.handlePreviewEmail}
                    onSubmitQuote={vm.handleSubmit}
                  />
                ) : undefined
              }
            />
          ) : (
            <QuoteFinancialForm
              lines={lines}
              unitPrices={vm.unitPrices}
              onUnitPriceChange={vm.handleUnitChange}
              canEdit={vm.canEdit}
              curLabel={vm.curLabel ?? ''}
              money={vm.money}
              readonlyFinancialSummary={readonlyFinancialSummary}
              readonlyQuoteDetails={readonlyQuoteDetails}
              subtotal={vm.subtotal}
              serviceFee={vm.serviceFee}
              onServiceFeeChange={vm.setServiceFee}
              bankFeePercentage={vm.bankFeePercentage}
              onBankFeePercentageChange={vm.setBankFeePercentage}
              bankFeeAmount={vm.bankFeeAmount}
              grandTotal={vm.grandTotal}
              paymentMethodsNote={vm.paymentMethodsNote}
              onPaymentMethodsNoteChange={vm.setPaymentMethodsNote}
              paymentSummary={paymentSummary}
              quoteSendActions={
                vm.onSendQuote && vm.canEdit ? (
                  <QuoteActionsBar
                    group="afterFinancial"
                    canEdit={vm.canEdit}
                    linesLength={lines.length}
                    isSending={vm.isSending}
                    previewLoading={vm.previewLoading}
                    onSendQuote={vm.onSendQuote}
                    onRequestEmailPreview={vm.onRequestEmailPreview}
                    onPreviewEmail={vm.handlePreviewEmail}
                    onSubmitQuote={vm.handleSubmit}
                  />
                ) : undefined
              }
            />
          )}
        </motion.div>

        {/* Sidebar droite: Client */}
        <motion.aside variants={fadeInUp} className="space-y-4">
          <QuoteClientCard client={client} clientSectionTitle={clientSectionTitle} />
        </motion.aside>
      </div>

      {dossierTimeline.length > 0 || quoteSnapshotHistory.length > 0 ? (
        <motion.div variants={fadeInUp} className="glass neo-raised rounded-xl px-4 py-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-foreground mb-2">
            <History size={14} className="text-muted-foreground" />
            Historique du dossier
          </div>

          {dossierTimeline.length > 0 && (
            <ul className="space-y-1.5 text-muted-foreground mb-3">
              {dossierTimeline.map((row) => (
                <li
                  key={`${row.event}-${row.at}-${row.label}`}
                  className="flex flex-wrap gap-x-3 gap-y-0.5 border-b border-border/30 pb-1.5 last:border-0 last:pb-0"
                >
                  <span className="text-[11px] tabular-nums shrink-0">
                    {row.at
                      ? new Date(row.at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
                      : '—'}
                  </span>
                  <span className="text-foreground font-medium">{row.label}</span>
                  {row.meta ? <span className="text-[11px] w-full sm:w-auto opacity-90">{row.meta}</span> : null}
                </li>
              ))}
            </ul>
          )}

          {quoteSnapshotHistory.length > 0 && (
            <>
              <div className="font-semibold text-foreground mb-1.5 text-[11px] uppercase tracking-wide">
                Versions de devis envoyées
              </div>
              <ul className="space-y-1.5 text-muted-foreground">
                {quoteSnapshotHistory.map((h) => (
                  <li
                    key={h.id}
                    className="flex flex-wrap gap-x-3 gap-y-0.5 border-b border-border/30 pb-1.5 last:border-0 last:pb-0"
                  >
                    <span className="tabular-nums">v{h.version}</span>
                    <span>
                      {h.total_primary} {h.primary_currency ?? ''}
                    </span>
                    {h.sent_at && (
                      <span className="text-[11px]">
                        {new Date(h.sent_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    )}
                    {h.revision_reason && (
                      <span className="text-[11px] w-full italic">« {h.revision_reason} »</span>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </motion.div>
      ) : null}

      <QuoteEmailPreviewDialog
        open={vm.previewOpen}
        onOpenChange={vm.setPreviewOpen}
        previewHtml={vm.previewHtml}
        curLabel={vm.curLabel ?? ''}
      />
    </motion.div>
  )
}

export default AdminShoppingQuoteView
