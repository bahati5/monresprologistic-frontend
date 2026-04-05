/* ── Operations: Pickups & Regroupements ── */

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

export interface Regroupement {
  id: number
  batch_number: string
  agency_id: number | null
  status: StatusData | string
  shipments?: Array<{ id: number; public_tracking?: string | null }>
  created_at: string
  updated_at: string
}

export interface RegroupementCreatePayload {
  shipment_ids: number[]
}
