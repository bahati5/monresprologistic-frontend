/* ── Inbound (Shipment Notices, Customer Packages) ── */

import type { StatusData } from '.'

export interface ShipmentNotice {
  id: number
  reference_code: string
  client_id: number
  client?: { id: number; name: string; email: string }
  carrier_name: string
  /** API pré-alerte / colis attendu */
  vendor_tracking_number?: string | null
  tracking_number?: string | null
  merchant_name?: string | null
  merchant?: string | null
  description: string | null
  declared_value: number | null
  value_currency: string | null
  purchase_date: string | null
  estimated_arrival_date: string | null
  attachment_url: string | null
  status: StatusData
  converted_customer_package_id: number | null
  created_at: string
  updated_at: string
}

export interface ShipmentNoticeCreatePayload {
  client_id?: number
  carrier_name: string
  vendor_tracking_number: string
  merchant_name?: string
  description?: string
  notes?: string
  declared_value?: number
  value_currency?: string
  purchase_date?: string
  estimated_arrival_date?: string
  attachment?: File
}

export interface CustomerPackage {
  id: number
  reference_code: string
  client_id: number
  client?: { id: number; name: string; email: string; locker_number?: string }
  description: string | null
  weight: number | null
  length: number | null
  width: number | null
  height: number | null
  declared_value: number | null
  total_charges: number
  amount_paid: number
  balance_due: number
  status: StatusData
  shipment_notice_id: number | null
  shipment_notice?: ShipmentNotice
  regroupement_id: number | null
  received_at: string | null
  received_by: string | null
  delivered_at: string | null
  logs: Array<{
    id: number
    status: StatusData
    note: string | null
    user_name: string | null
    created_at: string
  }>
  created_at: string
  updated_at: string
}

export interface CustomerPackageCreatePayload {
  client_id: number
  description?: string
  weight?: number
  length?: number
  width?: number
  height?: number
  declared_value?: number
  shipment_notice_id?: number
}
