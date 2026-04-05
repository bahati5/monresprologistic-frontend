/** Ligne du template API où `{{locker_code}}` est remplacé par ex. `MRP-0042`. */
export const LOCKER_TEMPLATE_LINE = 'Casier {{locker_code}}'

export type LockerHubFields = {
  street: string
  cityLine: string
  country: string
  phone: string
}

export function normalizeLockerDigits(raw: unknown): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 2) return 4
  return Math.min(10, Math.floor(n))
}

/**
 * Extrait les champs hub depuis `locker_address_template` (multi-lignes + placeholder).
 * Données legacy sans `{{locker_code}}` : tout va dans `street`.
 */
export function parseLockerAddressTemplate(template: string): LockerHubFields {
  const raw = template.replace(/\r\n/g, '\n').trimEnd()
  if (!raw) {
    return { street: '', cityLine: '', country: '', phone: '' }
  }
  const lines = raw.split('\n')
  const idx = lines.findIndex((l) => l.includes('{{locker_code}}'))
  if (idx === -1) {
    return { street: raw, cityLine: '', country: '', phone: '' }
  }
  const street = lines.slice(0, idx).join('\n').trim()
  const after = lines.slice(idx + 1)
  const cityLine = (after[0] ?? '').trim()
  const country = (after[1] ?? '').trim()
  const phone = after.slice(2).join('\n').trim()
  return { street, cityLine, country, phone }
}

export function buildLockerAddressTemplate(parts: LockerHubFields): string {
  const street = parts.street.trim()
  const cityLine = parts.cityLine.trim()
  const country = parts.country.trim()
  const phone = parts.phone.trim()
  return [street, LOCKER_TEMPLATE_LINE, cityLine, country, phone].join('\n')
}

/** ID factice pour l’aperçu admin (ex. MRP-0042). */
export function formatLockerPreviewId(prefixRaw: unknown, digitsRaw: unknown, sampleNum = 42): string {
  const prefix = String(prefixRaw ?? 'MRP').trim() || 'MRP'
  const digits = normalizeLockerDigits(digitsRaw)
  const n = String(Math.max(0, Math.floor(sampleNum))).padStart(digits, '0')
  return `${prefix}-${n}`
}

/** Remplace `{{locker_code}}` dans une ligne pour l’aperçu. */
export function previewLockerLine(line: string, previewId: string): string {
  return line.split('{{locker_code}}').join(previewId)
}
