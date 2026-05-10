/* ── Shipment entity types ── */

export interface ShipmentStatusPayload {
  code: string
  name: string
  color_hex?: string | null
}

/** Filtre liste expéditions (codes enum backend). */
export const SHIPMENT_STATUS_FILTER_OPTIONS: { code: string; name: string }[] = [
  { code: 'draft', name: 'Brouillon' },
  { code: 'pending_drop_off', name: 'En attente de dépôt' },
  { code: 'issue_reported', name: 'Problème signalé' },
  { code: 'received_at_hub', name: 'Réceptionné au hub' },
  { code: 'ready_for_dispatch', name: 'Prêt à l’expédition' },
  { code: 'in_transit', name: 'En transit' },
  { code: 'customs_hold', name: 'Blocage douane' },
  { code: 'arrived_at_destination', name: 'Arrivé à destination' },
  { code: 'delivery_failed', name: 'Échec de livraison' },
  { code: 'delivered', name: 'Livré' },
  { code: 'cancelled', name: 'Annulé' },
  { code: 'expired', name: 'Expiré' },
]

export interface ShipmentItem {
  id: number
  description: string
  quantity: number
  weight: number
  weight_kg?: number | null
  length: number | null
  width: number | null
  height: number | null
  declared_value: number | null
  value?: number | null
  category_id: number | null
  origin_country_id?: number | null
  category?: { id: number; name: string }
  origin_country?: { id: number; name: string; iso2?: string | null; code?: string | null }
}

export interface ShipmentCharge {
  id: number
  label: string
  amount: number
  type: 'tax' | 'fee' | 'discount'
}

export interface ShipmentLog {
  id: number
  title?: string | null
  description?: string | null
  status?: { code: string; name: string } | null
  note?: string | null
  user_name?: string | null
  changed_by_name?: string | null
  changed_at?: string | null
  created_at: string
}

export interface ShipmentPayment {
  id: number
  amount: number
  currency?: string | null
  method: string
  reference: string | null
  note: string | null
  created_at: string
  recorded_by?: string | null
}

export interface Shipment {
  id: number
  tracking_number: string
  reference_code: string | null
  status: ShipmentStatusPayload
  pre_alert_id?: number | null
  assisted_purchase_id?: number | null
  workflow_steps?: Array<{
    code: string
    label: string
    color?: string
    completed: boolean
    current: boolean
    date?: string | null
  }>
  available_transitions?: Array<{ code: string; label: string }>

  sender_name: string
  sender_phone: string | null
  sender_phone_secondary?: string | null
  sender_email: string | null
  sender_address: string | null
  sender_landmark?: string | null
  sender_zip_code?: string | null
  sender_city: string | null
  sender_state?: string | null
  sender_country: string | null
  client_id: number | null
  client?: { id: number; name: string; email: string }

  recipient_name: string
  recipient_phone: string | null
  recipient_phone_secondary?: string | null
  recipient_email: string | null
  recipient_address: string | null
  recipient_landmark?: string | null
  recipient_zip_code?: string | null
  recipient_city: string | null
  recipient_state?: string | null
  recipient_country: string | null
  recipient_id: number | null

  shipping_mode: string | null
  packaging_type: string | null
  transport_company: string | null
  ship_line: string | null
  delivery_time: string | null

  driver_id: number | null
  driver?: { id: number; name: string; phone: string }

  total_weight: number
  total_volume: number | null
  declared_value: number | null
  currency?: string | null

  subtotal?: number | null
  tax_total?: number | null
  total?: number | null
  amount_paid?: number | null
  balance_due?: number | null
  payment_status?: string
  paid_at?: string | null

  items: ShipmentItem[]
  charges: ShipmentCharge[]
  logs: ShipmentLog[]
  payments: ShipmentPayment[]

  notes: string | null
  delivery_notes: string | null
  signature_url: string | null
  signed_form_path?: string | null
  signed_form_url?: string | null
  has_signed_form?: boolean

  estimated_delivery: string | null
  delivered_at: string | null
  created_at: string
  updated_at: string
}

export interface ShipmentCreatePayload {
  sender_name: string
  sender_phone: string
  sender_email?: string
  sender_address?: string
  sender_city?: string
  sender_country?: string
  client_id?: number

  recipient_name: string
  recipient_phone: string
  recipient_email?: string
  recipient_address?: string
  recipient_city?: string
  recipient_country?: string
  recipient_id?: number

  shipping_mode_id?: number
  packaging_type_id?: number
  transport_company_id?: number
  ship_line_id?: number
  delivery_time_label?: string

  items: Array<{
    description: string
    quantity: number
    weight: number
    length?: number
    width?: number
    height?: number
    declared_value?: number
    category_id?: number
  }>

  notes?: string
}

export interface ShipmentListFilters {
  search?: string
  status?: string
  client_id?: number
  driver_id?: number
  from_date?: string
  to_date?: string
  page?: number
  per_page?: number
}
