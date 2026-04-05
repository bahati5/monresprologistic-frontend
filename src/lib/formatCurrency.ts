import type { PublicBranding } from '@/types/settings'

/** Symboles courants si `currency_symbol` est vide en base. */
const ISO_TO_SYMBOL: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  XOF: 'F CFA',
  XAF: 'F CFA',
  CDF: 'FC',
  CNY: '¥',
  JPY: '¥',
  CHF: 'CHF',
  CAD: 'CA$',
  AUD: 'A$',
  MAD: 'د.م.',
  ZAR: 'R',
}

export type MoneyFormatOptions = {
  symbol: string
  position: 'before' | 'after'
  minFractionDigits?: number
  maxFractionDigits?: number
  locale?: string
}

/**
 * Formate un montant avec symbole (sans code ISO). Pas de `Intl` style currency pour éviter « US$ » / codes.
 */
export function formatMoneyAmount(amount: number, opts: MoneyFormatOptions): string {
  const min = opts.minFractionDigits ?? 2
  const max = opts.maxFractionDigits ?? 2
  const locale = opts.locale ?? 'fr-FR'
  const num = new Intl.NumberFormat(locale, {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  }).format(amount)

  const sym = opts.symbol.trim()
  if (!sym) {
    return num
  }

  if (opts.position === 'before') {
    return `${sym}${num}`
  }

  return `${num}\u00A0${sym}`
}

export function resolveMoneySymbol(branding: Pick<PublicBranding, 'currency' | 'currency_symbol'>): string {
  const custom = String(branding.currency_symbol ?? '').trim()
  if (custom !== '') {
    return custom
  }
  const code = String(branding.currency ?? 'EUR').trim().toUpperCase()
  return ISO_TO_SYMBOL[code] ?? code
}

export function brandingToMoneyOptions(branding: PublicBranding | undefined): MoneyFormatOptions {
  const b = branding ?? {
    currency: 'EUR',
    currency_symbol: '',
    currency_position: 'after' as const,
  }
  return {
    symbol: resolveMoneySymbol(b),
    position: b.currency_position === 'before' ? 'before' : 'after',
  }
}

export function formatMoneyFromBranding(
  amount: number,
  branding: PublicBranding | undefined,
  fractionDigits?: { min?: number; max?: number },
): string {
  return formatMoneyAmount(amount, {
    ...brandingToMoneyOptions(branding),
    minFractionDigits: fractionDigits?.min,
    maxFractionDigits: fractionDigits?.max,
  })
}
