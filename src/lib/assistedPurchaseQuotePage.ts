import type {
  AdminQuoteLine,
  ReadonlyQuoteFinancialDetails,
} from '@/components/shopping/AdminShoppingQuoteView'
import {
  buildQuoteLines,
  computeReadonlyQuoteDetails,
  parseBankFeePercentage,
  purchaseStatusCode,
} from '@/lib/assistedPurchaseQuote'

export type AssistedPurchaseQuoteStatusCode = ReturnType<typeof purchaseStatusCode>

export interface AssistedPurchaseQuoteViewDerived {
  statusCode: AssistedPurchaseQuoteStatusCode
  statusLabel: string
  toneClassName: string | undefined
  displayCurrency: string
  lines: AdminQuoteLine[]
  initialBankPct: number
  initialPaymentNote: string | null
  readonlyDetails: ReadonlyQuoteFinancialDetails | null
  readonlyFinancial: { total: number; hint: string } | null
  canEdit: boolean
  canResendQuote: boolean
}

export function deriveAssistedPurchaseQuoteView(
  p: Record<string, unknown>,
  appCurrency: string,
): AssistedPurchaseQuoteViewDerived {
  const statusCode = purchaseStatusCode(p)
  const statusLabel =
    typeof p.status_label === 'string' && p.status_label.trim() ? p.status_label : statusCode
  const toneClassName = typeof p.status_color === 'string' ? p.status_color : undefined

  const canEdit = statusCode === 'pending_quote'
  const displayCurrency =
    !canEdit && typeof p.quote_currency === 'string' && p.quote_currency.trim() !== ''
      ? p.quote_currency.trim()
      : appCurrency
  const totalField = p.total_amount ?? p.quote_amount
  const quoteNum = totalField != null && totalField !== '' ? Number(totalField) : NaN
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

  return {
    statusCode,
    statusLabel,
    toneClassName,
    displayCurrency,
    lines,
    initialBankPct,
    initialPaymentNote,
    readonlyDetails,
    readonlyFinancial,
    canEdit,
    canResendQuote,
  }
}
