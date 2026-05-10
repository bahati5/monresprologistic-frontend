import { motion } from 'framer-motion'
import { Calculator, ExternalLink } from 'lucide-react'
import type { ReactNode } from 'react'

import { MerchantLogoBadge } from '@/components/shopping/MerchantLogoBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
    <>
      <motion.div variants={fadeInUp}>
        <Card className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
          <CardHeader className="border-b border-border/60 bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2 font-semibold">
                  <Calculator className="h-4 w-4 text-[#3d3d69]" aria-hidden />
                  Articles à chiffrer
                </CardTitle>
                <CardDescription>
                  {lines.length} ligne{lines.length > 1 ? 's' : ''} · montants en {curLabel}{' '}
                  {canEdit ? '(devise globale de l’application)' : null}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 border-b">
                  <TableHead className="min-w-[200px]">Article</TableHead>
                  <TableHead className="w-[120px]">Lien</TableHead>
                  <TableHead className="w-[88px] text-right">Qté</TableHead>
                  <TableHead className="w-[140px] text-right">Prix unitaire</TableHead>
                  <TableHead className="w-[140px] text-right">Total ligne</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Aucun article dans cette demande.
                    </TableCell>
                  </TableRow>
                ) : (
                  lines.map((line) => {
                    const u = parsePositiveNumber(unitPrices[String(line.id)] ?? '')
                    const lineTotal = u * (line.quantity || 0)
                    return (
                      <TableRow key={String(line.id)} className="group">
                        <TableCell>
                          <div className="flex items-start gap-3 min-w-0">
                            <MerchantLogoBadge
                              logoUrl={line.merchant?.logo_url}
                              merchantName={line.merchant?.name ?? line.articleLabel}
                              className="mt-0.5"
                            />
                            <div className="space-y-1 min-w-0">
                              <p className="font-medium leading-snug">{line.articleLabel || 'Article'}</p>
                              {line.optionsLabel ? (
                                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                  {line.optionsLabel}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {line.productUrl ? (
                            <Button variant="outline" size="sm" className="h-8 gap-1.5" asChild>
                              <a href={line.productUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                                Ouvrir
                              </a>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {line.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step={0.01}
                            disabled={!canEdit}
                            className="h-9 text-right tabular-nums max-w-[128px] ml-auto"
                            value={unitPrices[String(line.id)] ?? ''}
                            onChange={(e) => onUnitPriceChange(line.id, e.target.value)}
                            placeholder="0"
                            aria-label={`Prix unitaire pour ${line.articleLabel}`}
                          />
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">
                          {money(lineTotal)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeInUp} className="flex flex-col lg:flex-row gap-6 lg:justify-end">
        <Card className="w-full lg:max-w-md border-primary/20 bg-gradient-to-br from-card to-primary/[0.04] shadow-md ring-1 ring-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Synthèse financière</CardTitle>
            <CardDescription>
              {readonlyFinancialSummary && !canEdit
                ? 'Montant communiqué au client pour cette demande'
                : 'Sous-total, commission, frais bancaires et total à payer par le client'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {readonlyFinancialSummary && !canEdit ? (
              <>
                {readonlyQuoteDetails ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Sous-total articles</span>
                      <span className="font-semibold tabular-nums">{money(readonlyQuoteDetails.subtotal)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Frais de service</span>
                      <span className="font-semibold tabular-nums">{money(readonlyQuoteDetails.serviceFee)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">
                        Frais bancaires ({readonlyQuoteDetails.bankFeePercentage.toFixed(2).replace('.', ',')} %)
                      </span>
                      <span className="font-semibold tabular-nums">{money(readonlyQuoteDetails.bankFeeAmount)}</span>
                    </div>
                    {readonlyQuoteDetails.paymentMethodsNote ? (
                      <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/60 pt-3">
                        {readonlyQuoteDetails.paymentMethodsNote}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <div className="rounded-lg border border-blue-200/80 bg-blue-50/80 dark:border-blue-500/30 dark:bg-blue-500/10 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Total du devis
                  </p>
                  <p className="text-2xl font-bold tabular-nums text-blue-700 dark:text-blue-300 mt-1">
                    {money(readonlyFinancialSummary.total)}
                  </p>
                  {readonlyFinancialSummary.hint ? (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {readonlyFinancialSummary.hint}
                    </p>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-sm gap-4">
                  <span className="text-muted-foreground">Sous-total articles</span>
                  <span className="font-semibold tabular-nums">{money(subtotal)}</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-fee" className="text-sm font-medium">
                    Frais de service / Commission
                  </Label>
                  <Input
                    id="service-fee"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.01}
                    disabled={!canEdit}
                    className="h-10 tabular-nums"
                    value={serviceFee}
                    onChange={(e) => onServiceFeeChange(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-fee-pct" className="text-sm font-medium">
                    Frais bancaires (%)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Calcul : (sous-total + frais de service) × (pourcentage ÷ 100). Pré-rempli à 3 %, modifiable.
                  </p>
                  <Input
                    id="bank-fee-pct"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step={0.01}
                    disabled={!canEdit}
                    className="h-10 tabular-nums"
                    value={bankFeePercentage}
                    onChange={(e) => onBankFeePercentageChange(e.target.value)}
                    placeholder="3"
                  />
                </div>
                <div className="flex justify-between text-sm gap-4">
                  <span className="text-muted-foreground">Montant frais bancaires</span>
                  <span className="font-semibold tabular-nums">{money(bankFeeAmount)}</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-methods-note" className="text-sm font-medium">
                    Moyens de paiement (e-mail client)
                  </Label>
                  <Textarea
                    id="payment-methods-note"
                    rows={3}
                    disabled={!canEdit}
                    className="min-h-[88px] resize-y text-sm"
                    value={paymentMethodsNote}
                    onChange={(e) => onPaymentMethodsNoteChange(e.target.value)}
                    placeholder={DEFAULT_PAYMENT_METHODS_NOTE}
                  />
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between items-baseline gap-4">
                  <span className="text-sm font-medium">Total à payer</span>
                  <span className="text-xl font-bold tabular-nums text-primary">{money(grandTotal)}</span>
                </div>
                {quoteSendActions ? <div className="space-y-2">{quoteSendActions}</div> : null}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}
