/* ── Shipment entity types ── */

import type { StatusData } from '.'

export interface ShipmentItem {
  id: number
  description: string
  quantity: number
  weight: number
  length: number | null
  width: number | null
  height: number | null
  declared_value: number | null
  category_id: number | null
  category?: { id: number; name: string }
}

export interface ShipmentCharge {
  id: number
  label: string
  amount: number
  type: 'tax' | 'fee' | 'discount'
}

export interface ShipmentLog {
  id: number
  status: StatusData
  note: string | null
  user_name: string | null
  created_at: string
}

export interface ShipmentPayment {
  id: number
  amount: number
  method: string
  reference: string | null
  note: string | null
  created_at: string
}

export interface Shipment {
  id: number
  tracking_number: string
  reference_code: string | null
  status: StatusData
  status_id: number

  sender_name: string
  sender_phone: string
  sender_email: string | null
  sender_address: string | null
  sender_city: string | null
  sender_country: string | null
  client_id: number | null
  client?: { id: number; name: string; email: string }

  recipient_name: string
  recipient_phone: string
  recipient_email: string | null
  recipient_address: string | null
  recipient_city: string | null
  recipient_country: string | null
  recipient_id: number | null

  shipping_mode: string | null
  packaging_type: string | null
  transport_company: string | null
  ship_line: string | null
  incoterm: string | null
  delivery_time: string | null

  origin_office_id: number | null
  destination_office_id: number | null
  origin_office?: { id: number; name: string }
  destination_office?: { id: number; name: string }

  driver_id: number | null
  driver?: { id: number; name: string; phone: string }

  total_weight: number
  total_volume: number | null
  declared_value: number | null
  subtotal: number
  tax_total: number
  total: number
  amount_paid: number
  balance_due: number

  items: ShipmentItem[]
  charges: ShipmentCharge[]
  logs: ShipmentLog[]
  payments: ShipmentPayment[]

  notes: string | null
  delivery_notes: string | null
  signature_url: string | null

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
  incoterm_id?: number
  delivery_time_id?: number
  origin_office_id?: number
  destination_office_id?: number

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
  status_id?: number
  client_id?: number
  driver_id?: number
  from_date?: string
  to_date?: string
  page?: number
  per_page?: number
}
