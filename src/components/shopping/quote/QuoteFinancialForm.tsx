import { motion } from 'framer-motion'
import { Calculator, ExternalLink } from 'lucide-react'
import type { ReactNode } from 'react'

import { MerchantLogoBadge } from '@/components/shopping/MerchantLogoBadge'
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
import type { AdminQuoteLine, ReadonlyQuoteFinancialDetails } from '@/types/shopping'

export interface QuoteFinancialFormProps {
  lines: AdminQuoteLine[]
  unitPrices: Record<string, string>
  onUnitPriceChange: (id: string | number, value: string) => void
  canEdit: boolean
  curLabel: string
  money: (n: number) => string
  readonlyFinancialSummary: { total: number; hint?: string } | null
  readonlyQuoteDetails: ReadonlyQuoteFinancialDetails | null
  subtotal: number
  serviceFee: string
  onServiceFeeChange: (value: string) => void
  bankFeePercentage: string
  onBankFeePercentageChange: (value: string) => void
  bankFeeAmount: number
  grandTotal: number
  paymentMethodsNote: string
  onPaymentMethodsNoteChange: (value: string) => void
  quoteSendActions?: ReactNode
}

export function QuoteFinancialForm({
  lines,
  unitPrices,
  onUnitPriceChange,
  canEdit,
  curLabel,
  money,
  readonlyFinancialSummary,
  readonlyQuoteDetails,
  subtotal,
  serviceFee,
  onServiceFeeChange,
  bankFeePercentage,
  onBankFeePercentageChange,
  bankFeeAmount,
  grandTotal,
  paymentMethodsNote,
  onPaymentMethodsNoteChange,
  quoteSendActions,
}: QuoteFinancialFormProps) {
  return (
    <div className="space-y-4">
      {/* Tableau des articles */}
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

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b">
              <TableHead className="min-w-[180px] text-xs">Article</TableHead>
              <TableHead className="w-[90px] text-xs">Lien</TableHead>
              <TableHead className="w-[60px] text-right text-xs">Qté</TableHead>
              <TableHead className="w-[120px] text-right text-xs">P.U.</TableHead>
              <TableHead className="w-[110px] text-right text-xs">Total</TableHead>
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
                const lineTotal = u * (line.quantity || 0)
                return (
                  <TableRow key={String(line.id)} className="group">
                    <TableCell className="py-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <MerchantLogoBadge
                          logoUrl={line.merchant?.logo_url}
                          merchantName={line.merchant?.name ?? line.articleLabel}
                          className="mt-0.5"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-snug truncate">{line.articleLabel || 'Article'}</p>
                          {line.optionsLabel && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              {line.optionsLabel}
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
                    <TableCell className="text-right tabular-nums font-medium text-sm py-2">
                      {line.quantity}
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={0.01}
                        disabled={!canEdit}
                        className="h-7 text-right tabular-nums text-sm max-w-[100px] ml-auto"
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
      </motion.div>

      {/* Synthèse financière */}
      <motion.div variants={fadeInUp}>
        <div className="glass neo-raised rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Synthèse financière</h2>

          {readonlyFinancialSummary && !canEdit ? (
            <div className="space-y-2">
              {readonlyQuoteDetails && (
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground text-xs">Sous-total articles</span>
                    <span className="font-medium tabular-nums text-xs">{money(readonlyQuoteDetails.subtotal)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground text-xs">Frais de service</span>
                    <span className="font-medium tabular-nums text-xs">{money(readonlyQuoteDetails.serviceFee)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground text-xs">
                      Frais bancaires ({readonlyQuoteDetails.bankFeePercentage.toFixed(2).replace('.', ',')}%)
                    </span>
                    <span className="font-medium tabular-nums text-xs">{money(readonlyQuoteDetails.bankFeeAmount)}</span>
                  </div>
                  {readonlyQuoteDetails.paymentMethodsNote && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border/40 pt-2">
                      {readonlyQuoteDetails.paymentMethodsNote}
                    </p>
                  )}
                </div>
              )}
              <div className="neo-inset rounded-lg px-3 py-2">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Total du devis</p>
                <p className="text-xl font-bold tabular-nums text-[#073763] mt-0.5">
                  {money(readonlyFinancialSummary.total)}
                </p>
                {readonlyFinancialSummary.hint && (
                  <p className="text-[11px] text-muted-foreground mt-1">{readonlyFinancialSummary.hint}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between text-xs gap-4">
                <span className="text-muted-foreground">Sous-total articles</span>
                <span className="font-semibold tabular-nums">{money(subtotal)}</span>
              </div>

              <div className="space-y-1">
                <Label htmlFor="service-fee" className="text-xs font-medium">
                  Frais de service / commission
                </Label>
                <Input
                  id="service-fee"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.01}
                  disabled={!canEdit}
                  className="h-8 tabular-nums text-sm"
                  value={serviceFee}
                  onChange={(e) => onServiceFeeChange(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="bank-fee-pct" className="text-xs font-medium">
                  Frais bancaires (%)
                </Label>
                <Input
                  id="bank-fee-pct"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step={0.01}
                  disabled={!canEdit}
                  className="h-8 tabular-nums text-sm"
                  value={bankFeePercentage}
                  onChange={(e) => onBankFeePercentageChange(e.target.value)}
                  placeholder="3"
                />
                <p className="text-[10px] text-muted-foreground">
                  = {money(bankFeeAmount)} sur (sous-total + service)
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="payment-methods-note" className="text-xs font-medium">
                  Moyens de paiement (e-mail client)
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
              <div className="flex justify-between items-baseline gap-4">
                <span className="text-sm font-semibold">Total à payer</span>
                <span className="text-lg font-bold tabular-nums text-[#073763]">{money(grandTotal)}</span>
              </div>

              {quoteSendActions && <div className="pt-1">{quoteSendActions}</div>}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
