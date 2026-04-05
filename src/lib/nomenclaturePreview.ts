/**
 * Aperçu des formats de numérotation — garder aligné avec
 * backend/app/Support/ReferenceNumberFormatter.php et les générateurs (ShipmentObserver, LockerNumberGenerator, etc.).
 */
import { format, getISOWeek } from 'date-fns'

export type NomenclatureProfile = 'tracking' | 'locker' | 'shipment_invoice' | 'configurable_seq'

export function applyTemplate(template: string, replacements: Record<string, string | number>): string {
  let out = template
  for (const [k, v] of Object.entries(replacements)) {
    out = out.split(`{${k}}`).join(String(v))
  }
  return out
}

export function localeCalendarFromSettings(at: Date, s: Record<string, unknown>): Record<string, string> {
  const month = at.getMonth() + 1
  const w = getISOWeek(at)
  return {
    country: String(s.country ?? ''),
    country_code: String(s.country_iso2 ?? '').toUpperCase().trim(),
    week: String(w).padStart(2, '0'),
    quarter: String(Math.ceil(month / 3)),
    hub_brand: String(s.hub_brand_name ?? ''),
    year: format(at, 'yyyy'),
    month: format(at, 'MM'),
    day: format(at, 'dd'),
  }
}

function num(s: unknown, fallback: number): number {
  const n = Number(s)
  return Number.isFinite(n) ? n : fallback
}

function padSeq(val: number, pad: number): string {
  return String(Math.max(0, val)).padStart(Math.min(12, Math.max(1, pad)), '0')
}

function demoRandom(length: number, salt: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < length; i++) {
    out += chars[(salt * 17 + i * 31) % chars.length]!
  }
  return out
}

function demoRandnum(digits: number, salt: number): string {
  const d = Math.min(10, Math.max(2, digits))
  const max = Math.min(9999999999, 10 ** d - 1)
  const v = (salt * 7919) % (max + 1)
  return String(v).padStart(d, '0')
}

export function previewTrackingSample(
  s: Record<string, unknown>,
  formatStr: string,
  seqOffset: number,
  randomSalt: number,
  at = new Date(),
): string {
  const prefix = String(s.tracking_prefix ?? 'MRP').trim() || 'MRP'
  const randLen = Math.min(32, Math.max(4, num(s.tracking_number_length, 8)))
  const seqPad = Math.min(12, Math.max(1, num(s.shipment_tracking_seq_pad, 6)))
  const nextSeq = Math.max(1, num(s.shipment_tracking_next_seq, 1))
  const usesSeq = formatStr.includes('{seq}')
  const locale = localeCalendarFromSettings(at, s)
  const seqPadded = usesSeq ? padSeq(nextSeq + seqOffset, seqPad) : ''
  const random = demoRandom(randLen, randomSalt)
  return applyTemplate(formatStr, {
    ...locale,
    prefix,
    seq: seqPadded,
    random,
  })
}

export function buildTrackingPreviewSeries(
  s: Record<string, unknown>,
  formatStr: string,
  count = 6,
  at = new Date(),
): string[] {
  const usesSeq = formatStr.includes('{seq}')
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    out.push(previewTrackingSample(s, formatStr, usesSeq ? i : 0, i + 1, at))
  }
  return out
}

export function previewLockerSample(
  s: Record<string, unknown>,
  formatStr: string,
  seqOffset: number,
  salt: number,
  at = new Date(),
): string {
  const prefix = String(s.locker_prefix ?? 'MRP').trim() || 'MRP'
  const digits = Math.min(10, Math.max(2, num(s.locker_digits, 4)))
  const mode = String(s.locker_mode ?? 'random') === 'sequential' ? 'sequential' : 'random'
  const seqPadDefault = num(s.locker_seq_pad, 0) || digits
  const seqPad = Math.min(12, Math.max(1, seqPadDefault))
  const nextSeq = Math.max(1, num(s.locker_next_seq, 1))
  const usesSeq = formatStr.includes('{seq}')
  const usesRandnum = formatStr.includes('{randnum}')
  const usesRandom = formatStr.includes('{random}')
  const locale = localeCalendarFromSettings(at, s)
  let seq = ''
  if (usesSeq) {
    seq = padSeq(nextSeq + seqOffset, seqPad)
  }
  let randnum = ''
  if (usesRandnum) {
    if (mode === 'sequential' && !usesSeq) {
      randnum = String(1 + seqOffset).padStart(digits, '0')
    } else {
      randnum = demoRandnum(digits, salt + seqOffset * 13)
    }
  }
  const random = usesRandom ? demoRandom(Math.max(4, digits), salt) : ''
  return applyTemplate(formatStr, {
    ...locale,
    prefix,
    seq,
    randnum,
    random,
  })
}

export function buildLockerPreviewSeries(
  s: Record<string, unknown>,
  formatStr: string,
  count = 6,
  at = new Date(),
): string[] {
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    out.push(previewLockerSample(s, formatStr, i, i + 1, at))
  }
  return out
}

export function previewShipmentInvoiceSample(
  s: Record<string, unknown>,
  formatStr: string,
  seqOffset: number,
  at = new Date(),
): string {
  const prefix = String(s.shipment_invoice_prefix ?? 'FAC').trim() || 'FAC'
  const pad = Math.min(12, Math.max(1, num(s.shipment_invoice_seq_pad, 6)))
  const nextSeq = Math.max(1, num(s.shipment_invoice_next_seq, 1))
  const locale = localeCalendarFromSettings(at, s)
  const seqPadded = padSeq(nextSeq + seqOffset, pad)
  return applyTemplate(formatStr, {
    ...locale,
    prefix,
    seq: seqPadded,
    id: '12345',
  })
}

export function buildShipmentInvoicePreviewSeries(
  s: Record<string, unknown>,
  formatStr: string,
  count = 6,
  at = new Date(),
): string[] {
  return Array.from({ length: count }, (_, i) => previewShipmentInvoiceSample(s, formatStr, i, at))
}

export function previewConfigurableSeqSample(
  s: Record<string, unknown>,
  formatStr: string,
  prefixKey: string,
  padKey: string,
  nextSeqKey: string,
  prefixDefault: string,
  padDefault: number,
  seqOffset: number,
  at = new Date(),
): string {
  const prefix = String(s[prefixKey] ?? prefixDefault).trim() || prefixDefault
  const pad = Math.min(12, Math.max(1, num(s[padKey], padDefault)))
  const nextSeq = Math.max(1, num(s[nextSeqKey], 1))
  const locale = localeCalendarFromSettings(at, s)
  return applyTemplate(formatStr, {
    ...locale,
    prefix,
    seq: padSeq(nextSeq + seqOffset, pad),
  })
}

export function buildConfigurablePreviewSeries(
  s: Record<string, unknown>,
  formatStr: string,
  keys: { prefixKey: string; padKey: string; nextSeqKey: string },
  defaults: { prefix: string; pad: number },
  count = 6,
  at = new Date(),
): string[] {
  return Array.from({ length: count }, (_, i) =>
    previewConfigurableSeqSample(
      s,
      formatStr,
      keys.prefixKey,
      keys.padKey,
      keys.nextSeqKey,
      defaults.prefix,
      defaults.pad,
      i,
      at,
    ),
  )
}

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
  configurable?: { keys: { prefixKey: string; padKey: string; nextSeqKey: string }; defaults: { prefix: string; pad: number } },
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
