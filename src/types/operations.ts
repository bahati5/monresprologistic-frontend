/* ── Operations: Pickups & Consolidations ── */

import type { StatusData } from '.'

export interface Pickup {
  id: number
  reference_code: string
  client_id: number
  client?: { id: number; name: string; email: string; phone: string }
  pickup_address: string
  pickup_city: string | null
  pickup_country: string | null
  pickup_phone: string | null
  description: string | null
  estimated_weight: number | null
  preferred_date: string | null
  preferred_time: string | null
  status: StatusData
  driver_id: number | null
  driver?: { id: number; name: string; phone: string }
  notes: string | null
  collected_at: string | null
  delivered_to_hub_at: string | null
  created_at: string
  updated_at: string
}

export interface PickupCreatePayload {
  client_id?: number
  pickup_address: string
  pickup_city?: string
  pickup_country?: string
  pickup_phone?: string
  description?: string
  estimated_weight?: number
  preferred_date?: string
  preferred_time?: string
  notes?: string
}

export interface Consolidation {
  id: number
  reference_code: string
  type: 'shipments' | 'packages'
  origin: string | null
  destination: string | null
  shipping_mode: string | null
  status: StatusData
  driver_id: number | null
  driver?: { id: number; name: string }
  total_weight: number | null
  total_items: number
  notes: string | null
  shipment_ids: number[]
  package_ids: number[]
  closed_at: string | null
  shipped_at: string | null
  arrived_at: string | null
  created_at: string
  updated_at: string
}

export interface ConsolidationCreatePayload {
  type: 'shipments' | 'packages'
  origin?: string
  destination?: string
  shipping_mode?: string
  notes?: string
  shipment_ids?: number[]
  package_ids?: number[]
}
