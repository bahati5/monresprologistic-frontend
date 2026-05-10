import { STATUS_COLORS } from '@/lib/animations'

export interface ShipmentDisplay {
  stCode: string
  stColor: string
  tracking: string | undefined
  senderLabel: string | undefined
  recipientLabel: string | undefined
  recipientCity: string | undefined
  modeLabel: string | undefined
  amount: unknown
  eligibleRegroupe: boolean
}

export function shipmentDisplay(s: {
  status?: { code?: string; color_hex?: string | null; color?: string | null; name?: unknown }
  tracking_number?: string | null
  public_tracking?: string | null
  sender_name?: string | null
  sender?: { name?: string | null }
  sender_client?: {
    display_name?: string | null
    first_name?: string | null
    last_name?: string | null
  }
  client?: { name?: string | null }
  recipient_name?: string | null
  delivery_recipient?: { name?: string | null; city?: string | null }
  recipient?: { name?: string | null }
  recipient_city?: string | null
  shipping_mode?: string | null
  service_type?: { name?: string | null }
  total?: unknown
  calculated_price?: unknown
  regroupement_id?: number | null
  master_shipment_id?: number | null
}): ShipmentDisplay {
  const stCode = s.status?.code || ''
  const stColor = STATUS_COLORS[stCode] || s.status?.color_hex || s.status?.color || '#64748B'
  const tracking = s.tracking_number || s.public_tracking || undefined
  const senderLabel =
    s.sender_name
    || s.sender?.name
    || s.sender_client?.display_name
    || s.client?.name
    || [s.sender_client?.first_name, s.sender_client?.last_name].filter(Boolean).join(' ')
  const recipientLabel =
    s.recipient_name
    || s.delivery_recipient?.name
    || s.recipient?.name
    || undefined
  const recipientCity = s.recipient_city || s.delivery_recipient?.city || undefined
  const modeLabel = s.shipping_mode ?? s.service_type?.name ?? undefined
  const amount = s.total ?? s.calculated_price
  const eligibleRegroupe = !s.regroupement_id && !s.master_shipment_id
  return {
    stCode,
    stColor,
    tracking,
    senderLabel,
    recipientLabel,
    recipientCity,
    modeLabel,
    amount,
    eligibleRegroupe,
  }
}
