import type { TimelineEvent } from '@/components/workflow/TimelineLog'
import {
  DIRECT_SHIPMENT_STEP_ORDER,
  PREALERT_SHIPMENT_STEP_ORDER,
  ASSISTED_PURCHASE_STEP_ORDER,
  PAYMENT_METHOD_FALLBACK,
} from '@/constants/shipment'
import type { ShipmentLog } from '@/types/shipment'
import { displayLocalized } from '@/lib/localizedString'

export function completedBeforeCurrent(
  currentStatusCode: string,
  fromPreAlert: boolean,
  fromAssistedPurchase?: boolean,
): string[] {
  let order: readonly string[]
  if (fromAssistedPurchase) {
    order = ASSISTED_PURCHASE_STEP_ORDER
  } else if (fromPreAlert) {
    order = PREALERT_SHIPMENT_STEP_ORDER
  } else {
    order = DIRECT_SHIPMENT_STEP_ORDER
  }
  const idx = order.indexOf(currentStatusCode)
  if (idx <= 0) return []
  return [...order.slice(0, idx)]
}

export function labelForRegroupementStatus(
  status: unknown,
  filterOptions: { code: string; name: string }[],
): string {
  const code = typeof status === 'string' ? status : (status as { code?: string })?.code
  if (!code) return '—'
  return filterOptions.find((o) => o.code === code)?.name ?? code
}

export function paymentStatusBadge(paymentStatus: string | undefined) {
  const ps = paymentStatus || 'unpaid'
  if (ps === 'paid')
    return {
      label: 'Payé',
      style: { backgroundColor: '#16a34a20', color: '#16a34a', borderColor: '#16a34a40' },
    }
  if (ps === 'partial')
    return {
      label: 'Paiement partiel',
      style: { backgroundColor: '#d9770620', color: '#d97706', borderColor: '#d9770640' },
    }
  return {
    label: 'Impayé',
    style: { backgroundColor: '#64748b20', color: '#64748b', borderColor: '#64748b40' },
  }
}

export function paymentMethodDisplayLabel(
  code: string,
  methods: { code?: string | null; id: number; name: unknown; is_active?: boolean }[] | undefined,
): string {
  const active = methods?.filter((m) => m.is_active !== false) ?? []
  const found = active.find((m) => (m.code || String(m.id)) === code)
  if (found) return displayLocalized(found.name)
  return PAYMENT_METHOD_FALLBACK[code] ?? code
}

export function buildShipmentTimelineEvents(logs: ShipmentLog[] | undefined): TimelineEvent[] {
  return (logs || [])
    .slice()
    .sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0
      return tb - ta
    })
    .map((log, i) => {
      const when = log.created_at
        ? new Date(log.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
        : ''
      const statusLabel = log.status?.name || log.title || 'Mise à jour'
      const by = log.changed_by_name || log.user_name
      const note = log.description || log.note
      const descParts = [when ? `Le ${when}` : '', note ? String(note) : ''].filter(Boolean)
      return {
        id: String(log.id || i),
        title: statusLabel,
        description: descParts.length ? descParts.join(' — ') : undefined,
        date: '',
        actor: by ? `Par ${by}` : undefined,
        type: 'status' as const,
      }
    })
}
