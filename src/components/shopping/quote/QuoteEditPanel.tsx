import { useState, useMemo, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Calculator, ExternalLink, Package, MessageSquare, Clock } from 'lucide-react'

import { MerchantLogoBadge } from '@/components/shopping/MerchantLogoBadge'
import { ArticleAvailabilityChecker } from '@/components/shopping/quote/ArticleAvailabilityChecker'
import { QuoteLineEditor } from '@/components/shopping/quote/QuoteLineEditor'
import { QuoteUrgencyFlag } from '@/components/shopping/quote/QuoteUrgencyFlag'
import { QuoteSendValidationDisplay, validateQuoteSend } from '@/components/shopping/quote/QuoteSendValidation'
import { QuoteRevisionBanner } from '@/components/shopping/quote/QuoteRevisionBanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DEFAULT_PAYMENT_METHODS_NOTE } from '@/constants/shopping'
import { fadeInUp } from '@/lib/animations'
import { parsePositiveNumber } from '@/lib/shoppingQuoteCalculations'
import type { AdminQuoteLine } from '@/types/shopping'
import type { AssistedPurchasePaymentSummary, ServerQuoteConfigurationLine } from '@/lib/assistedPurchaseQuote'
import type { PurchaseArticle, ArticleAvailability, ActiveQuoteLine } from '@/types/assistedPurchase'

interface QuoteRevision {
  version: number
  created_at: string
  reason: string | null
  total: number
  currency: string
  created_by_name: string | null
}

export interface QuoteEditPanelProps {
  requestId: string | number
  lines: AdminQuoteLine[]
  articles: PurchaseArticle[]
  clientNote: string | null
  currency: string
  curLabel: string
  money: (n: number) => string
  canEdit: boolean

  unitPrices: Record<string, string>
  onUnitPriceChange: (id: string | number, value: string) => void

  quantities: Record<string, string>
  onQuantityChange: (id: string | number, value: string) => void

  paymentMethodsNote: string
  onPaymentMethodsNoteChange: (value: string) => void

  estimatedDelivery: string
  onEstimatedDeliveryChange: (value: string) => void

  staffMessage: string
  onStaffMessageChange: (value: string) => void

  onQuoteTotalChange: (total: number, totalSecondary: number | null) => void
  onQuoteLinesChange: (activeLines: ActiveQuoteLine[]) => void
  onAvailabilityChange: (articleId: number, availability: ArticleAvailability) => void
  onRetryExtraction?: (articleId: number) => void
  onMarkAllUnavailable?: () => void

  isUrgent?: boolean
  onUrgentChange?: (v: boolean) => void
  urgencySurchargePercent?: string
  onUrgencySurchargeChange?: (v: string) => void

  currentVersion?: number
  revisions?: QuoteRevision[]
  onCreateRevision?: (reason: string) => Promise<void>
  isCreatingRevision?: boolean

  quoteSendActions?: ReactNode

  /** Restauration brouillon — attendre avant d'initialiser le moteur de lignes */
  quoteLineEditorReady?: boolean
  prefillDynamicQuoteLines?: ActiveQuoteLine[] | null
  /** Lignes du dernier snapshot (réédition) */
  serverQuoteConfigurationLines?: ServerQuoteConfigurationLine[] | null
  lineEditorResetKey?: string
  paymentSummary?: AssistedPurchasePaymentSummary | null
}

export function QuoteEditPanel({
  requestId,
  lines,
  articles,
  clientNote,
  currency,
  curLabel,
  money,
  canEdit,
  unitPrices,
  onUnitPriceChange,
  quantities,
  onQuantityChange,
  paymentMethodsNote,
  onPaymentMethodsNoteChange,
  estimatedDelivery,
  onEstimatedDeliveryChange,
  staffMessage,
  onStaffMessageChange,
  onQuoteTotalChange,
  onQuoteLinesChange,
  onAvailabilityChange,
  onRetryExtraction,
  onMarkAllUnavailable,
  isUrgent = false,
  onUrgentChange,
  urgencySurchargePercent = '',
  onUrgencySurchargeChange,
  currentVersion = 1,
  revisions = [],
  onCreateRevision,
  isCreatingRevision = false,
  quoteSendActions,
  quoteLineEditorReady = true,
  prefillDynamicQuoteLines = null,
  serverQuoteConfigurationLines = null,
  lineEditorResetKey = '1-0',
  paymentSummary = null,
}: QuoteEditPanelProps) {
  const [currentQuoteTotal, setCurrentQuoteTotal] = useState(0)
  const [activeQuoteLines, setActiveQuoteLines] = useState<ActiveQuoteLine[]>([])

  const subtotal = useMemo(() => {
    let sum = 0
    for (const line of lines) {
      const u = parsePositiveNumber(unitPrices[String(line.id)] ?? '')
      const q = parsePositiveNumber(quantities[String(line.id)] ?? String(line.quantity || 0))
      sum += u * q
    }
    return sum
  }, [lines, unitPrices, quantities])

  const handleTotalChange = (total: number, totalSecondary: number | null) => {
    setCurrentQuoteTotal(total)
    onQuoteTotalChange(total, totalSecondary)
  }

  const handleLinesChange = (newLines: ActiveQuoteLine[]) => {
    setActiveQuoteLines(newLines)
    onQuoteLinesChange(newLines)
  }

  const sendValidation = useMemo(
    () => validateQuoteSend({ articles, activeLines: activeQuoteLines, subtotal }),
    [articles, activeQuoteLines, subtotal],
  )

  return (
    <div className="space-y-4">
      {(currentVersion > 1 || revisions.length > 0) && (
        <motion.div variants={fadeInUp}>
          <QuoteRevisionBanner
            currentVersion={currentVersion}
            revisions={revisions}
            canCreateRevision={canEdit && !!onCreateRevision}
            onCreateRevision={onCreateRevision ?? (async () => {})}
            isCreating={isCreatingRevision}
            money={money}
          />
        </motion.div>
      )}

      {articles.length > 0 && (
        <motion.div variants={fadeInUp}>
          <ArticleAvailabilityChecker
            articles={articles}
            clientNote={clientNote}
            onAvailabilityChange={onAvailabilityChange}
            readOnly={!canEdit}
            onRetryExtraction={onRetryExtraction}
            onMarkAllUnavailable={onMarkAllUnavailable}
          />
        </motion.div>
      )}

      <motion.div variants={fadeInUp} className="glass neo-raised rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
          <div className="p-1.5 bg-[#073763]/5 rounded-lg">
            <Calculator size={14} className="text-[#073763]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Articles à chiffrer</h2>
            <p className="text-[11px] text-muted-foreground">
              {lines.length} ligne{lines.length > 1 ? 's' : ''} · montants en {curLabel}
            </p>
          </div>
        </div>

        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b">
              <TableHead className="text-xs w-[40%]">Article</TableHead>
              <TableHead className="w-[70px] text-xs">Lien</TableHead>
              <TableHead className="w-[70px] text-right text-xs">Qté</TableHead>
              <TableHead className="w-[110px] text-right text-xs">P.U.</TableHead>
              <TableHead className="w-[100px] text-right text-xs">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-16 text-center text-muted-foreground text-sm">
                  Aucun article dans cette demande.
                </TableCell>
              </TableRow>
            ) : (
              lines.map((line) => {
                const u = parsePositiveNumber(unitPrices[String(line.id)] ?? '')
                const q = parsePositiveNumber(quantities[String(line.id)] ?? String(line.quantity || 0))
                const lineTotal = u * q
                const matchedArticle = articles.find((a) => String(a.id) === String(line.id))
                const originalCurrency = matchedArticle?.currency_original
                const originalPrice = matchedArticle?.price_original

                return (
                  <TableRow key={String(line.id)} className="group">
                    <TableCell className="py-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <MerchantLogoBadge
                          logoUrl={line.merchant?.logo_url}
                          merchantName={line.merchant?.name ?? line.articleLabel}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 overflow-hidden">
                          <p className="text-sm font-medium leading-snug break-words line-clamp-2">
                            {line.articleLabel || 'Article'}
                          </p>
                          {line.optionsLabel && (
                            <p className="text-[11px] text-muted-foreground break-words line-clamp-1">
                              {line.optionsLabel}
                            </p>
                          )}
                          {originalCurrency && originalCurrency !== currency && originalPrice != null && (
                            <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                              Prix original : {originalCurrency} {originalPrice.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      {line.productUrl ? (
                        <Button variant="outline" size="sm" className="h-6 text-[11px] gap-1 px-2" asChild>
                          <a href={line.productUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink size={11} />
                            Voir
                          </a>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        step={1}
                        disabled={!canEdit}
                        className="h-8 min-h-8 py-1.5 text-right tabular-nums text-sm font-semibold text-foreground bg-background border border-input shadow-sm max-w-[64px] ml-auto"
                        value={quantities[String(line.id)] ?? String(line.quantity || 1)}
                        onChange={(e) => onQuantityChange(line.id, e.target.value)}
                        aria-label={`Quantité pour ${line.articleLabel}`}
                      />
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={0.01}
                        disabled={!canEdit}
                        className="h-8 min-h-8 py-1.5 text-right tabular-nums text-sm font-semibold text-foreground bg-background border border-input shadow-sm max-w-[100px] ml-auto"
                        value={unitPrices[String(line.id)] ?? ''}
                        onChange={(e) => onUnitPriceChange(line.id, e.target.value)}
                        placeholder="0"
                        aria-label={`Prix unitaire pour ${line.articleLabel}`}
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-sm py-2">
                      {money(lineTotal)}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        <div className="px-4 py-2 border-t border-border/40 flex justify-between items-baseline bg-muted/10">
          <span className="text-xs text-muted-foreground">Sous-total articles</span>
          <span className="text-sm font-semibold tabular-nums">{money(subtotal)}</span>
        </div>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <QuoteLineEditor
          key={`quote-lines-${String(requestId)}-${lineEditorResetKey}`}
          productPrice={subtotal}
          currency={currency}
          onTotalChange={handleTotalChange}
          onLinesChange={handleLinesChange}
          readOnly={!canEdit}
          readyToInit={quoteLineEditorReady}
          prefillLines={prefillDynamicQuoteLines}
          serverConfigurationLines={serverQuoteConfigurationLines}
        />
      </motion.div>

      {canEdit && onUrgentChange && (
        <motion.div variants={fadeInUp}>
          <QuoteUrgencyFlag
            isUrgent={isUrgent}
            onUrgentChange={onUrgentChange}
            urgencySurchargePercent={urgencySurchargePercent}
            onUrgencySurchargeChange={onUrgencySurchargeChange ?? (() => {})}
            readOnly={!canEdit}
          />
        </motion.div>
      )}

      <motion.div variants={fadeInUp}>
        <div className="glass neo-raised rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-[#073763]/5 rounded-lg">
              <Package size={14} className="text-[#073763]" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Informations complémentaires</h2>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="estimated-delivery" className="text-xs font-medium flex items-center gap-1.5">
              <Clock size={12} />
              Délai estimé
            </Label>
            <Input
              id="estimated-delivery"
              disabled={!canEdit}
              className="h-8 text-sm"
              value={estimatedDelivery}
              onChange={(e) => onEstimatedDeliveryChange(e.target.value)}
              placeholder="7 à 14 jours ouvrés"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="staff-message" className="text-xs font-medium flex items-center gap-1.5">
              <MessageSquare size={12} />
              Message au client (optionnel)
            </Label>
            <Textarea
              id="staff-message"
              rows={2}
              disabled={!canEdit}
              className="min-h-[50px] resize-y text-xs"
              value={staffMessage}
              onChange={(e) => onStaffMessageChange(e.target.value)}
              placeholder="Votre casque est disponible en noir comme demandé."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-methods-note" className="text-xs font-medium">
              Moyens de paiement (affiché dans l'e-mail client)
            </Label>
            <Textarea
              id="payment-methods-note"
              rows={2}
              disabled={!canEdit}
              className="min-h-[60px] resize-y text-xs"
              value={paymentMethodsNote}
              onChange={(e) => onPaymentMethodsNoteChange(e.target.value)}
              placeholder={DEFAULT_PAYMENT_METHODS_NOTE}
            />
          </div>

          <div className="h-px bg-border/60" />

          {paymentSummary && (paymentSummary.rows.length > 0 || paymentSummary.remaining > 0) && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-foreground">Encaissements</h3>
              {paymentSummary.rows.length > 0 && (
                <ul className="space-y-1 text-[11px] text-muted-foreground max-h-32 overflow-y-auto">
                  {paymentSummary.rows.map((row) => (
                    <li key={row.id} className="flex justify-between gap-2 border-b border-border/20 pb-1">
                      <span>
                        {row.created_at
                          ? new Date(row.created_at).toLocaleString('fr-FR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '—'}
                        {row.recorded_by_name ? ` · ${row.recorded_by_name}` : ''}
                      </span>
                      <span className="font-medium tabular-nums text-foreground shrink-0">
                        {money(row.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex justify-between text-xs gap-2">
                <span className="text-muted-foreground">Total encaissé</span>
                <span className="font-semibold tabular-nums">{money(paymentSummary.totalPaid)}</span>
              </div>
              <div className="flex justify-between text-xs gap-2">
                <span className="text-muted-foreground">Solde restant</span>
                <span className="font-semibold tabular-nums text-[#073763]">{money(paymentSummary.remaining)}</span>
              </div>
            </div>
          )}

          <div className="h-px bg-border/60" />

          <div className="flex justify-between items-baseline gap-4">
            <span className="text-sm font-semibold">Total du devis</span>
            <span className="text-lg font-bold tabular-nums text-[#073763]">
              {money(currentQuoteTotal || subtotal)}
            </span>
          </div>

          {canEdit && articles.length > 0 && (
            <div className="pt-1">
              <QuoteSendValidationDisplay validation={sendValidation} />
            </div>
          )}

          {quoteSendActions && <div className="pt-1">{quoteSendActions}</div>}
        </div>
      </motion.div>
    </div>
  )
}
