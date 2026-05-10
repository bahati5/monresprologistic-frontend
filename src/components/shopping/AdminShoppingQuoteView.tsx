import { motion } from 'framer-motion'

import { QuoteActionsBar } from '@/components/shopping/quote/QuoteActionsBar'
import { QuoteClientCard } from '@/components/shopping/quote/QuoteClientCard'
import { QuoteEmailPreviewDialog } from '@/components/shopping/quote/QuoteEmailPreviewDialog'
import { QuoteFinancialForm } from '@/components/shopping/quote/QuoteFinancialForm'
import { QuoteMarkOrderedDialog } from '@/components/shopping/quote/QuoteMarkOrderedDialog'
import { useAdminShoppingQuoteViewState } from '@/components/shopping/quote/useAdminShoppingQuoteViewState'
import { Badge } from '@/components/ui/badge'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import { cn } from '@/lib/utils'
import { useFormatMoney } from '@/hooks/useSettings'

import type { AdminShoppingQuoteViewProps } from '@/types/shopping'

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
  currency = 'EUR',
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
  markPaidAction = null,
  clientSectionTitle = 'Client',
  convertToShipmentAction = null,
  convertedShipmentId = null,
  paymentProofUrl = null,
  onQuoteDataChange,
  draftIndicator,
}: AdminShoppingQuoteViewProps) {
  const { formatMoney, branding } = useFormatMoney()
  const vm = useAdminShoppingQuoteViewState({
    requestId,
    status,
    lines,
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
              markPaidAction={markPaidAction}
              paymentProofUrl={paymentProofUrl}
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
          <QuoteFinancialForm
            lines={lines}
            unitPrices={vm.unitPrices}
            onUnitPriceChange={vm.handleUnitChange}
            canEdit={vm.canEdit}
            curLabel={vm.curLabel}
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
        </motion.div>

        {/* Sidebar droite: Client */}
        <motion.aside variants={fadeInUp} className="space-y-4">
          <QuoteClientCard client={client} clientSectionTitle={clientSectionTitle} />
        </motion.aside>
      </div>

      <QuoteEmailPreviewDialog
        open={vm.previewOpen}
        onOpenChange={vm.setPreviewOpen}
        previewHtml={vm.previewHtml}
        curLabel={vm.curLabel}
      />
    </motion.div>
  )
}

export default AdminShoppingQuoteView
