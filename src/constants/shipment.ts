export const DIRECT_SHIPMENT_STEP_ORDER = [
  'draft',
  'received_at_hub',
  'ready_for_dispatch',
  'in_transit',
  'arrived_at_destination',
  'delivered',
] as const

export const PREALERT_SHIPMENT_STEP_ORDER = [
  'pending_drop_off',
  'received_at_hub',
  'ready_for_dispatch',
  'in_transit',
  'arrived_at_destination',
  'delivered',
] as const

export const ASSISTED_PURCHASE_STEP_ORDER = [
  'received_at_hub',
  'ready_for_dispatch',
  'in_transit',
  'arrived_at_destination',
  'delivered',
] as const

export const PAYMENT_METHOD_FALLBACK: Record<string, string> = {
  cash: 'Espèces',
  mobile_money: 'Mobile Money',
  bank_transfer: 'Virement bancaire',
  card: 'Carte bancaire',
  other: 'Autre',
}
