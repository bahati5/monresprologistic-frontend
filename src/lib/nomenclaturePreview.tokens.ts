import {
  buildConfigurablePreviewSeries,
  buildLockerPreviewSeries,
  buildShipmentInvoicePreviewSeries,
  buildTrackingPreviewSeries,
} from '@/lib/nomenclaturePreview.builders'

export type NomenclatureProfile = 'tracking' | 'locker' | 'shipment_invoice' | 'configurable_seq'

export type NomenclatureTokenDef = { token: string; label: string }

export const NOMENCLATURE_DATE_TOKENS: NomenclatureTokenDef[] = [
  { token: '{year}', label: 'Année' },
  { token: '{month}', label: 'Mois' },
  { token: '{day}', label: 'Jour' },
  { token: '{week}', label: 'Semaine ISO' },
  { token: '{quarter}', label: 'Trimestre' },
]

export const NOMENCLATURE_LOCALE_TOKENS: NomenclatureTokenDef[] = [
  { token: '{country_code}', label: 'Code pays' },
  { token: '{country}', label: 'Pays' },
  { token: '{hub_brand}', label: 'Marque hub' },
]

export function tokensAllowedForProfile(profile: NomenclatureProfile): NomenclatureTokenDef[] {
  const datesAndLocale = [...NOMENCLATURE_DATE_TOKENS, ...NOMENCLATURE_LOCALE_TOKENS]
  const prefix = { token: '{prefix}', label: 'Préfixe (paramètre)' } as const
  if (profile === 'tracking') {
    return [...datesAndLocale, prefix, { token: '{seq}', label: 'Compteur' }, { token: '{random}', label: 'Aléatoire' }]
  }
  if (profile === 'locker') {
    return [
      ...datesAndLocale,
      prefix,
      { token: '{seq}', label: 'Compteur' },
      { token: '{random}', label: 'Aléatoire' },
      { token: '{randnum}', label: 'Chiffres' },
    ]
  }
  if (profile === 'shipment_invoice') {
    return [
      ...datesAndLocale,
      prefix,
      { token: '{seq}', label: 'Compteur' },
      { token: '{id}', label: 'ID expédition' },
    ]
  }
  return [...datesAndLocale, prefix, { token: '{seq}', label: 'Compteur' }]
}

export function defaultFormatForProfile(profile: NomenclatureProfile): string {
  switch (profile) {
    case 'tracking':
      return '{prefix}-{random}'
    case 'locker':
      return '{prefix}-{randnum}'
    case 'shipment_invoice':
      return '{prefix}-{year}-{seq}'
    default:
      return '{prefix}-{seq}'
  }
}

export function buildPreviewSeriesForProfile(
  profile: NomenclatureProfile,
  s: Record<string, unknown>,
  formatStr: string,
  configurable?: {
    keys: { prefixKey: string; padKey: string; nextSeqKey: string }
    defaults: { prefix: string; pad: number }
  },
  count = 6,
  at = new Date(),
): string[] {
  const fmt = formatStr.trim() || defaultFormatForProfile(profile)
  switch (profile) {
    case 'tracking':
      return buildTrackingPreviewSeries(s, fmt, count, at)
    case 'locker':
      return buildLockerPreviewSeries(s, fmt, count, at)
    case 'shipment_invoice':
      return buildShipmentInvoicePreviewSeries(s, fmt, count, at)
    case 'configurable_seq':
      if (!configurable) return []
      return buildConfigurablePreviewSeries(s, fmt, configurable.keys, configurable.defaults, count, at)
    default:
      return []
  }
}

export function collectUsedTokens(pattern: string, allowed: NomenclatureTokenDef[]): string[] {
  const used: string[] = []
  for (const { token } of allowed) {
    if (pattern.includes(token)) {
      used.push(token)
    }
  }
  return used
}
