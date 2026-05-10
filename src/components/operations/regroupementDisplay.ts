import { STATUS_COLORS } from '@/lib/animations'
import { SHIPMENT_STATUS_FILTER_OPTIONS } from '@/types/shipment'
import { displayLocalized } from '@/lib/localizedString'
import type { RegroupementsIndexData } from '@/hooks/useOperations'

export type RegroupementListItem = NonNullable<RegroupementsIndexData['regroupements']>[number]

export function lotStatusDisplay(c: RegroupementListItem) {
  const statusVal = c.status as string | NonNullable<RegroupementListItem['status']> | undefined
  const stCode = typeof statusVal === 'string' ? statusVal : statusVal?.code || ''
  const stColor =
    (typeof statusVal === 'object' && statusVal?.color_hex)
    || STATUS_COLORS[stCode]
    || '#64748B'
  const stLabel =
    (statusVal && typeof statusVal === 'object' && 'name' in statusVal && statusVal.name
      ? displayLocalized(statusVal.name)
      : null)
    ?? SHIPMENT_STATUS_FILTER_OPTIONS.find((o) => o.code === stCode)?.name
    ?? stCode
    ?? '—'
  return { stCode, stColor, stLabel }
}
