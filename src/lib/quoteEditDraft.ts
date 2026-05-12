import type { ActiveQuoteLine } from '@/types/assistedPurchase'

/** Snapshot édition devis — sauvegardé en session et côté API (form_drafts). */
export type QuoteEditDraftSnapshot = {
  v: 1
  savedAt: string
  unitPrices: Record<string, string>
  quantities: Record<string, string>
  serviceFee: string
  bankFeePercentage: string
  paymentMethodsNote: string
  estimatedDelivery: string
  staffMessage: string
  activeQuoteLines: ActiveQuoteLine[]
  articleAvailabilities: Record<string, { status: string; alternative_note: string }>
}

const STORAGE_PREFIX = 'assisted-quote-draft:'

export function quoteDraftStorageKey(requestId: string | number): string {
  return `${STORAGE_PREFIX}${requestId}`
}

export function readQuoteDraftFromSession(requestId: string | number): QuoteEditDraftSnapshot | null {
  try {
    const raw = sessionStorage.getItem(quoteDraftStorageKey(requestId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<QuoteEditDraftSnapshot>
    if (parsed?.v !== 1 || typeof parsed.savedAt !== 'string') return null
    return parsed as QuoteEditDraftSnapshot
  } catch {
    return null
  }
}

export function writeQuoteDraftToSession(requestId: string | number, snapshot: QuoteEditDraftSnapshot): void {
  try {
    sessionStorage.setItem(quoteDraftStorageKey(requestId), JSON.stringify(snapshot))
  } catch {
    // quota / private mode
  }
}

export function clearQuoteDraftSession(requestId: string | number): void {
  try {
    sessionStorage.removeItem(quoteDraftStorageKey(requestId))
  } catch {
    // ignore
  }
}

/** Convertit un payload API (form_drafts) partiel en snapshot si besoin. */
export function normalizeDraftPayload(raw: Record<string, unknown>): QuoteEditDraftSnapshot | null {
  try {
    const savedAt =
      typeof raw.savedAt === 'string'
        ? raw.savedAt
        : typeof raw.saved_at === 'string'
          ? raw.saved_at
          : new Date().toISOString()
    return {
      v: 1,
      savedAt,
      unitPrices: (raw.unitPrices as Record<string, string>) ?? {},
      quantities: (raw.quantities as Record<string, string>) ?? {},
      serviceFee: String(raw.serviceFee ?? ''),
      bankFeePercentage: String(raw.bankFeePercentage ?? '3'),
      paymentMethodsNote: String(raw.paymentMethodsNote ?? ''),
      estimatedDelivery: String(raw.estimatedDelivery ?? ''),
      staffMessage: String(raw.staffMessage ?? ''),
      activeQuoteLines: Array.isArray(raw.activeQuoteLines) ? (raw.activeQuoteLines as ActiveQuoteLine[]) : [],
      articleAvailabilities:
        raw.articleAvailabilities && typeof raw.articleAvailabilities === 'object'
          ? (raw.articleAvailabilities as Record<string, { status: string; alternative_note: string }>)
          : {},
    }
  } catch {
    return null
  }
}

export function pickNewerDraft(
  a: QuoteEditDraftSnapshot | null,
  b: QuoteEditDraftSnapshot | null,
): QuoteEditDraftSnapshot | null {
  if (!a && !b) return null
  if (!a) return b
  if (!b) return a
  return new Date(a.savedAt).getTime() >= new Date(b.savedAt).getTime() ? a : b
}
