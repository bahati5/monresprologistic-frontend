/**
 * Affichage cohérent des expéditions (snake_case API Laravel + suivi / contrepartie).
 */

import { SHIPMENT_STATUS_FILTER_OPTIONS } from '@/types/shipment'

export function normalizeShipmentStatusCode(raw: unknown): string {
  if (raw == null) return ''
  if (typeof raw === 'string') return raw
  if (typeof raw === 'object' && raw !== null && 'value' in (raw as object)) {
    return String((raw as { value: string }).value)
  }
  return String(raw)
}

/**
 * Certains formats de suivi mal paramétrés produisent un code commençant par un tiret seul (ex. `-ABC123`).
 */
export function formatPublicTrackingDisplay(code: unknown, shipmentId?: number): string {
  const c = code != null && String(code).trim() !== '' ? String(code).trim() : ''
  if (!c) return shipmentId != null ? `#${shipmentId}` : '—'
  if (c.startsWith('-') && c.length > 1 && /^-[A-Z0-9_-]+$/i.test(c)) {
    return c.slice(1)
  }
  return c
}

type ProfileSnippet = {
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
}

function profileLabel(p: ProfileSnippet | null | undefined): string {
  if (!p) return ''
  const full = typeof p.full_name === 'string' ? p.full_name.trim() : ''
  if (full) return full
  const fn = typeof p.first_name === 'string' ? p.first_name.trim() : ''
  const ln = typeof p.last_name === 'string' ? p.last_name.trim() : ''
  if (fn || ln) return `${fn} ${ln}`.trim()
  return ''
}

/**
 * Expéditeur ou destinataire : accepte les clés snake_case et camelCase (JSON Laravel).
 */
export function getShipmentCounterpartyLabel(
  s: Record<string, unknown> | null | undefined,
  role: 'sender' | 'recipient'
): string {
  if (!s) return '—'
  const rec =
    role === 'recipient'
      ? ((s.recipient_profile ?? s.recipientProfile) as ProfileSnippet | undefined)
      : ((s.sender_profile ?? s.senderProfile) as ProfileSnippet | undefined)
  const fromProfile = profileLabel(rec)
  if (fromProfile) return fromProfile

  const denorm =
    role === 'recipient'
      ? (s.recipient_name ?? s.recipientName)
      : (s.sender_name ?? s.senderName)
  if (typeof denorm === 'string' && denorm.trim()) return denorm.trim()

  const pid =
    role === 'recipient'
      ? (s.recipient_profile_id ?? s.recipientProfileId)
      : (s.sender_profile_id ?? s.senderProfileId)
  if (typeof pid === 'number' && pid > 0) return `Profil #${pid}`
  return '—'
}

export function shipmentStatusLabelFr(code: string): string {
  const c = code.trim()
  const o = SHIPMENT_STATUS_FILTER_OPTIONS.find((x) => x.code === c)
  if (o) return o.name
  if (!c) return '—'
  return c.replace(/_/g, ' ')
}
