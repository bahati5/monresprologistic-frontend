import type { WizardCountryRow } from '@/types/shipmentCreate'
import { displayLocalized } from '@/lib/localizedString'

export function wizardRateUnitPrice(rate: Record<string, unknown>): number {
  const raw = rate.unit_price ?? rate.unitPrice
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = parseFloat(raw.replace(',', '.'))
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

export function firstDeliveryOptionFromMode(mode: unknown): string {
  if (!mode || typeof mode !== 'object') return ''
  const m = mode as { delivery_options?: unknown; deliveryOptions?: unknown }
  const raw = m.delivery_options ?? m.deliveryOptions
  if (!Array.isArray(raw)) return ''
  for (const x of raw) {
    const t = String(x).trim()
    if (t !== '') return t
  }
  return ''
}

export function effectiveDelayLabelForRate(rate: Record<string, unknown>): string {
  const ov = rate.delivery_label_override
  if (typeof ov === 'string' && ov.trim() !== '') return ov.trim()
  const sm = rate.shipping_mode as Record<string, unknown> | undefined
  return firstDeliveryOptionFromMode(sm)
}

export function displayCountryName(c: Record<string, unknown>): string {
  return displayLocalized(c.name)
}

export function countryIso(c: Record<string, unknown>): string {
  return (c.iso2 as string | undefined) || (c.code as string | undefined) || ''
}

export function mergeWizardCountryRows(
  countriesFromLocations: WizardCountryRow[],
  fromWizard: WizardCountryRow[],
): WizardCountryRow[] {
  const byId = new Map<string, WizardCountryRow>()
  for (const row of countriesFromLocations) {
    byId.set(String(row.id), {
      id: row.id,
      name: row.name,
      code: row.code || null,
      iso2: row.iso2 ?? null,
      emoji: row.emoji ?? null,
    })
  }
  for (const c of fromWizard) {
    const idStr = String(c.id)
    if (!byId.has(idStr)) {
      byId.set(idStr, c)
    }
  }
  return Array.from(byId.values()).sort((a, b) =>
    displayLocalized(a.name).localeCompare(displayLocalized(b.name), 'fr', {
      sensitivity: 'base',
    }),
  )
}
