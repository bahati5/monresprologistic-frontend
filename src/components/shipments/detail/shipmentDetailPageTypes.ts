import type { Shipment } from '@/types/shipment'
import type { ShipmentRegroupementSummary } from '@/components/shipments/detail/ShipmentDetailRegroupementCard'

export type ShipmentDetailData = Shipment & {
  regroupement_id?: number | null
  regroupement?: ShipmentRegroupementSummary
  route_display?: string | null
  corridor?: {
    origin_iso2?: string | null
    dest_iso2?: string | null
    origin_country?: string | null
    dest_country?: string | null
  }
  calculated_price?: string | null
}
