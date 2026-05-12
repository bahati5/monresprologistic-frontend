import { displayLocalized } from '@/lib/localizedString'
import type {
  AdminQuoteLine,
  ReadonlyQuoteFinancialDetails,
  ShoppingQuoteClientDetail,
} from '@/components/shopping/AdminShoppingQuoteView'
import type { PurchaseArticle, ArticleAvailability } from '@/types/assistedPurchase'

type PurchaseItemRow = {
  id?: unknown
  url?: unknown
  name?: unknown
  display_label?: unknown
  options?: unknown
  quantity?: unknown
  unit_price?: unknown
  merchant?: unknown
  price_displayed?: unknown
  price_converted?: unknown
  currency_original?: unknown
  image_url?: unknown
  is_available?: unknown
  scrape_status?: unknown
  attributes?: unknown
  preference?: unknown
  availability_status?: unknown
  alternative_note?: unknown
}

export function buildShoppingQuoteClient(p: Record<string, unknown>): ShoppingQuoteClientDetail {
  const u = p.user as Record<string, unknown> | undefined
  const prof = u?.profile as Record<string, unknown> | undefined
  const city = prof?.city as { name?: unknown } | undefined
  const state = prof?.state as { name?: unknown } | undefined
  const country = prof?.country as { name?: unknown } | undefined

  const name = displayLocalized(u?.name) || 'Client'
  const email = typeof u?.email === 'string' && u.email.trim() ? u.email.trim() : undefined

  const phoneUser = typeof u?.phone === 'string' && u.phone.trim() ? u.phone.trim() : ''
  const phoneProf =
    prof && typeof prof.phone === 'string' && String(prof.phone).trim()
      ? String(prof.phone).trim()
      : ''
  const phone = phoneUser || phoneProf || undefined

  const phoneSecondary =
    prof && typeof prof.phone_secondary === 'string' && String(prof.phone_secondary).trim()
      ? String(prof.phone_secondary).trim()
      : undefined

  const locker =
    u && typeof u.locker_number === 'string' && String(u.locker_number).trim()
      ? String(u.locker_number).trim()
      : undefined

  const addressLine =
    prof && typeof prof.address === 'string' && String(prof.address).trim()
      ? String(prof.address).trim()
      : undefined

  const landmark =
    prof && typeof prof.landmark === 'string' && String(prof.landmark).trim()
      ? String(prof.landmark).trim()
      : undefined

  const zip = prof && prof.zip_code != null && String(prof.zip_code).trim() ? String(prof.zip_code).trim() : ''
  const cityName = displayLocalized(city?.name)
  const cityLine = [zip, cityName].filter(Boolean).join(' ').trim() || undefined
  const stateN = displayLocalized(state?.name) || undefined
  const countryN = displayLocalized(country?.name) || undefined

  return {
    name,
    email,
    phone,
    phoneSecondary,
    lockerNumber: locker,
    addressLine,
    landmark,
    cityLine,
    state: stateN,
    country: countryN,
  }
}

export function purchaseStatusCode(p: Record<string, unknown>): string {
  const s = p.status
  if (typeof s === 'string') return s
  if (s && typeof s === 'object' && 'value' in (s as object)) {
    const v = (s as { value?: string }).value
    if (typeof v === 'string') return v
  }
  return ''
}

function itemMerchantForQuoteLine(it: PurchaseItemRow): AdminQuoteLine['merchant'] {
  const m = it.merchant
  if (!m || typeof m !== 'object') return null
  const o = m as Record<string, unknown>
  const idRaw = o.id
  const id =
    typeof idRaw === 'number' && Number.isFinite(idRaw)
      ? idRaw
      : typeof idRaw === 'string' && idRaw.trim() !== ''
        ? Number(idRaw)
        : undefined
  const name = typeof o.name === 'string' && o.name.trim() ? o.name.trim() : null
  const logo_url = typeof o.logo_url === 'string' && o.logo_url.trim() ? o.logo_url.trim() : null
  if (id == null && !name && !logo_url) return null
  return {
    id: id != null && Number.isFinite(id) ? id : undefined,
    name,
    logo_url,
  }
}

function fallbackArticleLabelFromUrl(url: string): string {
  const t = url.trim()
  if (!t) return 'Article'
  try {
    const u = new URL(t)
    const host = u.hostname.replace(/^www\./i, '')
    if (/amzn\.|^amazon\./i.test(host)) return `Produit (${host})`
    return host ? `Produit (${host})` : 'Article'
  } catch {
    return 'Article'
  }
}

export function buildQuoteLines(p: Record<string, unknown>, canEdit: boolean, quoteNum: number): AdminQuoteLine[] {
  const rawItems = p.items as PurchaseItemRow[] | undefined
  if (Array.isArray(rawItems) && rawItems.length > 0) {
    return rawItems.map((it) => {
      const qty = typeof it.quantity === 'number' ? it.quantity : Number(it.quantity) || 1
      const unitFromItem = it.unit_price != null && it.unit_price !== '' ? Number(it.unit_price) : NaN
      let initialUnitPrice: number | null = null
      if (Number.isFinite(unitFromItem)) {
        initialUnitPrice = unitFromItem
      } else if (canEdit && rawItems.length === 1 && p.price_displayed != null) {
        initialUnitPrice = Number(p.price_displayed)
      } else if (!canEdit && rawItems.length === 1 && Number.isFinite(quoteNum) && qty > 0) {
        initialUnitPrice = quoteNum / qty
      }
      const urlStr = String(it.url ?? '')
      return {
        id: it.id as string | number,
        articleLabel:
          (typeof it.display_label === 'string' && it.display_label.trim()) ||
          (typeof it.name === 'string' && it.name.trim()) ||
          (typeof p.article_label === 'string' && p.article_label.trim()) ||
          fallbackArticleLabelFromUrl(urlStr) ||
          'Article',
        optionsLabel: typeof it.options === 'string' ? it.options : null,
        productUrl: String(it.url ?? ''),
        quantity: qty,
        initialUnitPrice: Number.isFinite(initialUnitPrice ?? NaN) ? initialUnitPrice : null,
        merchant: itemMerchantForQuoteLine(it),
      }
    })
  }

  const qty = typeof p.quantity === 'number' ? p.quantity : Number(p.quantity) || 1
  const legacyUrl = String(p.product_url ?? '')
  return [
    {
      id: p.id as string | number,
      articleLabel:
        (typeof p.article_label === 'string' && p.article_label.trim()) ||
        fallbackArticleLabelFromUrl(legacyUrl) ||
        'Article',
      optionsLabel: typeof p.line_notes === 'string' ? p.line_notes : null,
      productUrl: String(p.product_url ?? ''),
      quantity: qty,
      initialUnitPrice:
        canEdit && p.price_displayed != null
          ? Number(p.price_displayed)
          : Number.isFinite(quoteNum) && qty > 0
            ? quoteNum / qty
            : null,
    },
  ]
}

function parseAvailability(it: PurchaseItemRow): ArticleAvailability {
  const raw = it.availability_status
  const validStatuses = ['not_checked', 'available_exact', 'available_alternative', 'unavailable'] as const
  const status =
    typeof raw === 'string' && (validStatuses as readonly string[]).includes(raw)
      ? (raw as ArticleAvailability['status'])
      : 'not_checked'
  return {
    status,
    alternative_note: typeof it.alternative_note === 'string' ? it.alternative_note : '',
  }
}

function parseAttributes(raw: unknown): Record<string, string[]> {
  if (!raw || typeof raw !== 'object') return {}
  const result: Record<string, string[]> = {}
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(val)) {
      result[key] = val.map(String)
    } else if (typeof val === 'string') {
      result[key] = [val]
    }
  }
  return result
}

function parsePreference(raw: unknown): PurchaseArticle['preference'] {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const primary = typeof o.primary === 'string' ? o.primary : ''
  if (!primary) return null
  return {
    primary,
    alternative: typeof o.alternative === 'string' ? o.alternative : null,
    alternative_declared: Boolean(o.alternative_declared),
  }
}

export function buildPurchaseArticles(p: Record<string, unknown>): PurchaseArticle[] {
  const rawItems = p.items as PurchaseItemRow[] | undefined
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    const legacyUrl = String(p.product_url ?? '')
    const qty = typeof p.quantity === 'number' ? p.quantity : Number(p.quantity) || 1
    const priceConv = p.price_displayed != null ? Number(p.price_displayed) : null
    return [
      {
        id: Number(p.id) || 0,
        name:
          (typeof p.article_label === 'string' && p.article_label.trim()) ||
          fallbackArticleLabelFromUrl(legacyUrl) ||
          'Article',
        product_url: legacyUrl,
        price_original: null,
        price_converted: Number.isFinite(priceConv) ? priceConv : null,
        currency_original: null,
        quantity: qty,
        merchant: null,
        attributes: {},
        preference: null,
        availability: { status: 'not_checked', alternative_note: '' },
        image_url: null,
        is_available: null,
        scrape_status: 'manual',
        options_label: typeof p.line_notes === 'string' ? p.line_notes : null,
      },
    ]
  }

  return rawItems.map((it) => {
    const qty = typeof it.quantity === 'number' ? it.quantity : Number(it.quantity) || 1
    const priceOrig = it.price_displayed != null ? Number(it.price_displayed) : null
    const priceConv = it.price_converted != null ? Number(it.price_converted) : null
    const m = itemMerchantForQuoteLine(it)

    return {
      id: Number(it.id) || 0,
      name:
        (typeof it.display_label === 'string' && it.display_label.trim()) ||
        (typeof it.name === 'string' && it.name.trim()) ||
        'Article',
      product_url: String(it.url ?? ''),
      price_original: Number.isFinite(priceOrig) ? priceOrig : null,
      price_converted: Number.isFinite(priceConv) ? priceConv : null,
      currency_original: typeof it.currency_original === 'string' ? it.currency_original : null,
      quantity: qty,
      merchant: m
        ? { id: m.id, name: m.name ?? undefined, logo_url: m.logo_url }
        : null,
      attributes: parseAttributes(it.attributes),
      preference: parsePreference(it.preference),
      availability: parseAvailability(it),
      image_url: typeof it.image_url === 'string' && it.image_url.trim() ? it.image_url.trim() : null,
      is_available: typeof it.is_available === 'boolean' ? it.is_available : null,
      scrape_status:
        typeof it.scrape_status === 'string' &&
        ['pending', 'success', 'failed', 'manual'].includes(it.scrape_status)
          ? (it.scrape_status as PurchaseArticle['scrape_status'])
          : 'manual',
      options_label: typeof it.options === 'string' ? it.options : null,
    }
  })
}

export function parseBankFeePercentage(p: Record<string, unknown>): number {
  const v = p.bank_fee_percentage
  if (v != null && v !== '') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return 3
}

export function computeReadonlyQuoteDetails(p: Record<string, unknown>): ReadonlyQuoteFinancialDetails & { snapshotLines?: { name: string; amount: number; type: string; value: number; is_visible_to_client: boolean }[] } {
  const rawItems = p.items as PurchaseItemRow[] | undefined
  let sub = 0
  if (Array.isArray(rawItems)) {
    for (const it of rawItems) {
      const u = Number(it.unit_price) || 0
      const q = typeof it.quantity === 'number' ? it.quantity : Number(it.quantity) || 0
      sub += u * q
    }
  }

  const snapshot = p.latest_snapshot as { snapshot_data?: { lines?: { name: string; amount: number; type: string; value: number; is_visible_to_client: boolean }[]; subtotal?: number } } | undefined
  const snapLines = snapshot?.snapshot_data?.lines

  if (Array.isArray(snapLines) && snapLines.length > 0) {
    const snapshotSub = Number(snapshot?.snapshot_data?.subtotal) || sub
    const totalField = p.total_amount ?? p.quote_amount
    const total = totalField != null && totalField !== '' ? Number(totalField) : snapshotSub
    const note = typeof p.payment_methods_note === 'string' ? p.payment_methods_note : null
    return {
      subtotal: snapshotSub,
      serviceFee: 0,
      bankFeeAmount: 0,
      bankFeePercentage: 0,
      paymentMethodsNote: note,
      total: Number.isFinite(total) ? total : snapshotSub,
      snapshotLines: snapLines,
    }
  }

  const svc = Number(p.service_fee) || 0
  const pct = parseBankFeePercentage(p)
  const bank = (sub + svc) * (pct / 100)
  const totalField = p.total_amount ?? p.quote_amount
  const total = totalField != null && totalField !== '' ? Number(totalField) : sub + svc + bank
  const note = typeof p.payment_methods_note === 'string' ? p.payment_methods_note : null
  return {
    subtotal: sub,
    serviceFee: svc,
    bankFeeAmount: bank,
    bankFeePercentage: pct,
    paymentMethodsNote: note,
    total: Number.isFinite(total) ? total : sub + svc + bank,
  }
}

export type ServerQuoteConfigurationLine = {
  internal_code: string
  name: string
  type: string
  calculation_base: string | null
  value: number
  is_visible_to_client: boolean
}

/** Lignes de configuration du dernier snapshot (pour rééditer / renvoyer un devis). */
export function extractServerQuoteConfigurationLines(p: Record<string, unknown>): ServerQuoteConfigurationLine[] | null {
  const snap = p.latest_snapshot as { snapshot_data?: Record<string, unknown> } | undefined
  const data = snap?.snapshot_data
  if (!data || typeof data !== 'object') return null

  const cfg = data.configuration_lines
  if (Array.isArray(cfg) && cfg.length > 0) {
    return cfg
      .map((raw: unknown) => {
        const o = raw as Record<string, unknown>
        return {
          internal_code: String(o.internal_code ?? ''),
          name: String(o.name ?? ''),
          type: String(o.type ?? 'manual'),
          calculation_base: o.calculation_base != null && String(o.calculation_base).trim() !== '' ? String(o.calculation_base) : null,
          value: Number(o.value) || 0,
          is_visible_to_client: Boolean(o.is_visible_to_client ?? true),
        }
      })
      .filter((r) => r.internal_code !== '' || r.name !== '')
  }

  const lines = data.lines
  if (!Array.isArray(lines) || lines.length === 0) return null

  return lines.map((raw: unknown, idx: number) => {
    const o = raw as Record<string, unknown>
    return {
      internal_code: String(o.internal_code ?? `LINE_${idx}`),
      name: String(o.name ?? ''),
      type: String(o.type ?? 'manual'),
      calculation_base: o.calculation_base != null && String(o.calculation_base).trim() !== '' ? String(o.calculation_base) : null,
      value: Number(o.value) || 0,
      is_visible_to_client: Boolean(o.is_visible_to_client ?? true),
    }
  })
}

export type AssistedPurchasePaymentLedgerRow = {
  id: number
  amount: number
  note: string | null
  created_at: string | null
  recorded_by_name: string | null
}

export type AssistedPurchasePaymentSummary = {
  totalQuote: number
  totalPaid: number
  remaining: number
  currency: string
  rows: AssistedPurchasePaymentLedgerRow[]
}

function roundMoney2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Synthèse des encaissements enregistrés (acomptes / soldes). */
export function buildAssistedPurchasePaymentSummary(p: Record<string, unknown>): AssistedPurchasePaymentSummary | null {
  const totalQuote = Number(p.total_amount ?? p.quote_amount ?? 0)
  if (!Number.isFinite(totalQuote) || totalQuote <= 0) return null

  const payments = Array.isArray(p.payments) ? (p.payments as Record<string, unknown>[]) : []
  let totalPaid = 0
  const rows: AssistedPurchasePaymentLedgerRow[] = []

  for (const row of payments) {
    const amt = Number(row.amount)
    if (!Number.isFinite(amt)) continue
    totalPaid += amt
    const rb = row.recorded_by as Record<string, unknown> | undefined
    const name = rb && typeof rb.name === 'string' && rb.name.trim() !== '' ? rb.name.trim() : null
    rows.push({
      id: Number(row.id) || 0,
      amount: roundMoney2(amt),
      note: typeof row.note === 'string' && row.note.trim() !== '' ? row.note.trim() : null,
      created_at: row.created_at != null ? String(row.created_at) : null,
      recorded_by_name: name,
    })
  }

  rows.sort((a, b) => a.id - b.id)

  const currency =
    typeof p.quote_currency === 'string' && p.quote_currency.trim() !== '' ? p.quote_currency.trim() : ''

  const paid = roundMoney2(totalPaid)
  return {
    totalQuote: roundMoney2(totalQuote),
    totalPaid: paid,
    remaining: roundMoney2(Math.max(0, totalQuote - paid)),
    currency,
    rows,
  }
}
