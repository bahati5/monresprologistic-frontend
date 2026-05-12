import type {
  AdminQuoteLine,
  ReadonlyQuoteFinancialDetails,
} from '@/components/shopping/AdminShoppingQuoteView'
import type { PurchaseArticle } from '@/types/assistedPurchase'
import {
  buildQuoteLines,
  buildPurchaseArticles,
  computeReadonlyQuoteDetails,
  parseBankFeePercentage,
  purchaseStatusCode,
  extractServerQuoteConfigurationLines,
  buildAssistedPurchasePaymentSummary,
} from '@/lib/assistedPurchaseQuote'

import type {
  AssistedPurchasePaymentSummary,
  ServerQuoteConfigurationLine,
} from '@/lib/assistedPurchaseQuote'

export type AssistedPurchaseQuoteStatusCode = ReturnType<typeof purchaseStatusCode>

export type QuoteSnapshotHistoryRow = {
  id: number
  version: number
  sent_at: string | null
  total_primary: string
  primary_currency: string | null
  revision_reason: string | null
  created_at: string | null
}

export type DossierTimelineRow = {
  at: string
  event: string
  label: string
  meta?: string | null
}

export interface AssistedPurchaseQuoteViewDerived {
  statusCode: AssistedPurchaseQuoteStatusCode
  statusLabel: string
  toneClassName: string | undefined
  displayCurrency: string
  lines: AdminQuoteLine[]
  articles: PurchaseArticle[]
  clientNote: string | null
  initialBankPct: number
  initialPaymentNote: string | null
  readonlyDetails: ReadonlyQuoteFinancialDetails | null
  readonlyFinancial: { total: number; hint: string } | null
  canEdit: boolean
  canResendQuote: boolean
  revisionHydration: { estimatedDelivery: string; staffMessage: string } | null
  paymentSummary: AssistedPurchasePaymentSummary | null
  serverQuoteConfigurationLines: ServerQuoteConfigurationLine[] | null
  lineEditorResetKey: string
  quoteSnapshotHistory: QuoteSnapshotHistoryRow[]
  dossierTimeline: DossierTimelineRow[]
}

export function deriveAssistedPurchaseQuoteView(
  p: Record<string, unknown>,
  appCurrency: string,
): AssistedPurchaseQuoteViewDerived {
  const statusCode = purchaseStatusCode(p)
  const statusLabel =
    typeof p.status_label === 'string' && p.status_label.trim() ? p.status_label : statusCode
  const toneClassName = typeof p.status_color === 'string' ? p.status_color : undefined

  const canEdit =
    statusCode === 'pending_quote' ||
    statusCode === 'quoted' ||
    statusCode === 'awaiting_payment'
  const displayCurrency =
    typeof p.quote_currency === 'string' && p.quote_currency.trim() !== ''
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
  const articles = buildPurchaseArticles(p)
  const clientNote =
    typeof p.client_note === 'string' && p.client_note.trim() !== ''
      ? p.client_note.trim()
      : typeof p.note === 'string' && p.note.trim() !== ''
        ? p.note.trim()
        : null
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

  const latestSnap = p.latest_snapshot as
    | { estimated_delivery?: string | null; staff_message?: string | null }
    | undefined
  const revisionHydration =
    canEdit && (statusCode === 'quoted' || statusCode === 'awaiting_payment') && latestSnap
      ? {
          estimatedDelivery:
            typeof latestSnap.estimated_delivery === 'string' ? latestSnap.estimated_delivery : '',
          staffMessage: typeof latestSnap.staff_message === 'string' ? latestSnap.staff_message : '',
        }
      : null

  const paymentSummary = buildAssistedPurchasePaymentSummary(p)
  const serverQuoteConfigurationLines = extractServerQuoteConfigurationLines(p)
  const qv = typeof p.quote_version === 'number' ? p.quote_version : Number(p.quote_version) || 1
  const cfgLen = serverQuoteConfigurationLines?.length ?? 0
  const lineEditorResetKey = `${qv}-${cfgLen}`

  const rawHistory = p.quote_snapshot_history
  const quoteSnapshotHistory = Array.isArray(rawHistory)
    ? (rawHistory as Record<string, unknown>[]).map((h) => ({
        id: Number(h.id) || 0,
        version: Number(h.version) || 0,
        sent_at: h.sent_at != null ? String(h.sent_at) : null,
        total_primary: String(h.total_primary ?? ''),
        primary_currency: h.primary_currency != null ? String(h.primary_currency) : null,
        revision_reason: h.revision_reason != null ? String(h.revision_reason) : null,
        created_at: h.created_at != null ? String(h.created_at) : null,
      }))
    : []

  const rawTimeline = p.dossier_timeline
  const dossierTimeline = Array.isArray(rawTimeline)
    ? (rawTimeline as Record<string, unknown>[]).map((row) => ({
        at: String(row.at ?? ''),
        event: String(row.event ?? ''),
        label: String(row.label ?? ''),
        meta: row.meta != null && String(row.meta).trim() !== '' ? String(row.meta) : null,
      }))
    : []

  return {
    statusCode,
    statusLabel,
    toneClassName,
    displayCurrency,
    lines,
    articles,
    clientNote,
    initialBankPct,
    initialPaymentNote,
    readonlyDetails,
    readonlyFinancial,
    canEdit,
    canResendQuote,
    revisionHydration,
    paymentSummary,
    serverQuoteConfigurationLines,
    lineEditorResetKey,
    quoteSnapshotHistory,
    dossierTimeline,
  }
}
